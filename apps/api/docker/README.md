# EZCRM Services

Serviços de infraestrutura para desenvolvimento local do EZCRM: **PostgreSQL** e **Redis**, via Docker Compose. As credenciais aqui definidas devem ser usadas no `.env` do backend.

## Comandos

### Subir os serviços

```bash
docker-compose up -d
```

### Parar os serviços

```bash
docker-compose down
```

### Ver logs

```bash
docker-compose logs -f
# Ou por serviço:
docker-compose logs -f ezcrm-db
docker-compose logs -f ezcrm-redis
```

### Verificar status

```bash
docker-compose ps
```

## Serviços

| Serviço         | Imagem             | Porta | Descrição                 |
| --------------- | ------------------ | ----- | ------------------------- |
| **ezcrm-db**    | postgres:15-alpine | 5432  | Banco de dados PostgreSQL |
| **ezcrm-redis** | redis:alpine       | 6379  | Cache / filas (Redis)     |

## Credenciais (PostgreSQL)

Estas variáveis devem ser usadas no `backend/.env` (ou copiadas de `backend/env.example`):

| Variável      | Valor           |
| ------------- | --------------- |
| `DB_TYPE`     | `postgres`      |
| `DB_HOST`     | `localhost`     |
| `DB_PORT`     | `5432`          |
| `DB_USERNAME` | `ezcrm`         |
| `DB_PASSWORD` | `ezcrmpassword` |
| `DB_DATABASE` | `ezcrm`     |

## Volumes

- **pg_data** — persistência dos dados do PostgreSQL. Os dados permanecem após `docker-compose down`. Para apagar tudo (incluindo dados): `docker-compose down -v`.

## Uso com Backend e Frontend

1. **Subir serviços:** `docker-compose up -d`
2. **Backend:** em `backend/`, configurar `.env` com as credenciais acima e rodar `npm run start:dev`. O TypeORM cria/migra as tabelas ao iniciar.
3. **Frontend:** em `frontend/`, rodar `npm run dev`. A API é chamada em `http://localhost:3001/api` (ou valor de `NEXT_PUBLIC_API_URL`).

O backend conecta ao banco em `localhost:5432` quando os containers estão rodando na mesma máquina.

## Observações

- O arquivo `docker-compose.yml` inclui comentários com exemplo de um possível serviço **ezcrm-backend** (NestJS) para rodar a API dentro do Compose; não é obrigatório para desenvolvimento local.
- Redis é opcional no início: o backend pode rodar sem Redis; quando for usar cache ou filas, a conexão já estará disponível em `localhost:6379`.

---

Para os comandos do backend (instalação, seeds, testes), veja [../README.md](../README.md) — o README do próprio backend, que é o repositório onde esta pasta vive.

O frontend do EZCRM é um **repositório separado** e não depende desta pasta: ele só precisa de uma API do EZCRM respondendo na URL configurada em `NEXT_PUBLIC_API_URL`.
