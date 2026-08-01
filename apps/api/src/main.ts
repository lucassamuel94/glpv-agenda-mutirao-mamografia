/*
 * O processo roda em UTC, e isso é load-bearing — não é preferência.
 *
 * As colunas de instante do schema são `timestamp` SEM timezone, e a sessão
 * Postgres roda em `TimeZone=UTC`. Numa coluna sem timezone não existe
 * "instante": existe uma data/hora de parede, e quem decide o que ela significa
 * é o fuso de quem escreve e de quem lê. Com o processo Node em
 * `America/Sao_Paulo` (UTC-3) havia DOIS fusos escrevendo na mesma coluna:
 *
 *  - valores gerados pelo Postgres (`clock_timestamp()` em
 *    `deal_stage_history.moved_at`, `DEFAULT now()` em `created_at`) nasciam
 *    em UTC;
 *  - valores gerados pelo Node (`new Date()` em `closed_at`, `completed_at`,
 *    `occurred_at`) eram serializados pelo driver `pg` com os getters LOCAIS
 *    do `Date`, gravando a hora de São Paulo como se fosse hora de sessão.
 *
 * Resultado MEDIDO: 3h exatas de divergência entre `closed_at` e `moved_at` do
 * MESMO evento, na MESMA transação — e a Fase 3 do produto (tempo médio por
 * etapa, taxa de conversão) é construída sobre esse par. Perto da meia-noite,
 * "ganhos de hoje" caía no dia errado.
 *
 * Alinhar o processo ao UTC faz `local === UTC === sessão Postgres`, então as
 * três origens de tempo concordam e a leitura hidrata o mesmo instante que
 * gravou. É a correção da CLASSE, não de cada coluna: qualquer `new Date()`
 * futuro nasce certo sem ninguém precisar lembrar desta armadilha.
 *
 * ## Por que TAMBÉM `TZ=UTC` nos scripts do `package.json`
 *
 * Esta linha aqui é rede de segurança, não a garantia. MEDIDO: atribuir
 * `process.env.TZ` **depois** que o processo começou não é confiável — um
 * `process.env.TZ = 'UTC'` dentro do `setupFiles` do Jest **não teve efeito
 * algum** (o mesmo teste falhava por 3h com ele, e passava com `TZ=UTC` na
 * linha de comando), porque o Node fixa o fuso antes de rodar código de
 * usuário. Quem garante o fuso é o prefixo `TZ=UTC` nos scripts de `start`,
 * `test`, `test:integration`, `seed:*` e `db:*`.
 *
 * Se você acrescentar um script que roda código deste projeto, **prefixe com
 * `TZ=UTC`** — senão ele grava instantes 3h deslocados dos que o resto do
 * sistema grava, e nada vai reclamar.
 */
process.env.TZ = 'UTC';

// Configuração global para crypto (necessário para algumas versões do Node.js)
if (typeof global.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto;
}

// IMPORTANTE: `initializeTransactionalContext` deve ser chamado ANTES de
// qualquer import do TypeORM (incluindo módulos do NestJS que importam
// entidades). Isso registra o AsyncLocalStorage que propaga o QueryRunner
// ativo através das chamadas async — base do isolamento por tenant + RLS.
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
initializeTransactionalContext({ storageDriver: StorageDriver.ASYNC_LOCAL_STORAGE });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { ResponseSanitizerInterceptor } from './common/interceptors/response-sanitizer.interceptor';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { DatabaseInitService } from './database/database-init.service';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { getDataSourceToken } from '@nestjs/typeorm';

/**
 * Função principal que inicializa a aplicação NestJS
 * Configura middlewares, CORS, validação e porta do servidor
 */
async function bootstrap() {
  // Cria o banco de dados ANTES de inicializar o NestJS
  // Isso evita erros de conexão quando o TypeORM tenta conectar
  try {
    await DatabaseInitService.ensureDatabaseFromEnv();
    console.log('✅ Banco de dados verificado/criado com sucesso');
  } catch (error: any) {
    console.error(`⚠️  Aviso ao verificar banco de dados: ${error.message}`);
    // Continua mesmo se houver erro (o banco pode já existir)
  }

  // Agora inicializa a aplicação normalmente
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // Cabeçalhos de segurança padrão (HSTS, X-Content-Type-Options,
  // X-Frame-Options, etc.). CSP desligado aqui: API pura sem HTML servido —
  // quem serve HTML pro usuário é o frontend Next.js, que tem sua própria
  // política.
  app.use(helmet({ contentSecurityPolicy: false }));
  // Limite default do body-parser (100kb) estoura no avatar em base64;
  // 5mb cobre uma foto de perfil comprimida com folga.
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Registra o DataSource 'master' no contexto transacional. A partir deste
  // ponto, `runInTransaction()` em qualquer parte do código ancora TODAS as
  // operações TypeORM (Repository, getRepository, etc.) na mesma conexão —
  // exatamente o que o RLS precisa para o SET do tenant_id ser respeitado.
  //
  // IMPORTANTE: `name: 'master'` deve bater com o `connectionName` usado em
  // `runInTransaction()` dentro do `TenantContextInterceptor`. Se a forma
  // curta `addTransactionalDataSource(ds)` for usada, a lib registra como
  // `'default'` e o interceptor falha com "No data sources defined".
  const masterDataSource = app.get<DataSource>(getDataSourceToken('master'));
  addTransactionalDataSource({ name: 'master', dataSource: masterDataSource });

  // WebSocket com Socket.IO (autenticação via cookie auth-token)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Configuração CORS manual para evitar duplicação de headers
  // Middleware deve ser o primeiro para garantir que headers sejam definidos apenas uma vez
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Verifica se a origin é permitida. `localhost`/`127.0.0.1` são
    // conveniência de DEV — fora de produção, nunca (resíduo que deixava
    // CORS aberto pra qualquer processo local mesmo com deploy real).
    const isDev = process.env.NODE_ENV !== 'production';
    const isAllowed =
      !origin ||
      (isDev &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) ||
      origin === process.env.FRONTEND_URL;

    if (isAllowed && origin) {
      // Remove headers CORS existentes antes de adicionar novos (evita duplicação)
      res.removeHeader('Access-Control-Allow-Origin');
      res.removeHeader('Access-Control-Allow-Credentials');
      res.removeHeader('Access-Control-Allow-Methods');
      res.removeHeader('Access-Control-Allow-Headers');
      res.removeHeader('Access-Control-Expose-Headers');
      res.removeHeader('Access-Control-Max-Age');

      // Adiciona headers CORS uma única vez
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
      );
      res.setHeader('Access-Control-Expose-Headers', 'Authorization, Set-Cookie, X-Request-Id');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  });

  // Middleware para parsing de cookies
  app.use(cookieParser());

  // Pipeline global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma automaticamente tipos
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita propriedades não permitidas
    })
  );

  // Interceptor global para remover campos sensíveis dos responses
  app.useGlobalInterceptors(new ResponseSanitizerInterceptor());

  // Prefixo global para APIs
  app.setGlobalPrefix('api');

  // ==========================================
  // DOCUMENTAÇÃO SWAGGER
  // ==========================================
  const appName = process.env.APP_NAME || 'EZ Starter Kit';
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} - API`)
    .setDescription(
      `API completa do sistema ${appName} Enterprise - Sistema de CRM All-in-One. ` +
        'Inclui endpoints para gestão de clientes, vendas, marketing, financeiro e operações.'
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Porta do servidor
  const port = process.env.PORT || 3001;

  await app.listen(port);

  console.log(`🚀 Servidor ${appName} rodando na porta ${port}`);
  console.log(`📊 API disponível em: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/docs`);
  console.log(`🌍 Frontend esperado em: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
}

bootstrap();
