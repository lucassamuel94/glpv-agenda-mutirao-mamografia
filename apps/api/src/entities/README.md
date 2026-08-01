# Entidades (TypeORM)

Esta pasta contém as **entidades** do TypeORM — modelo de dados do sistema. Cada arquivo define uma tabela (colunas, relações, índices).

## Regra: apenas modelo

- **Não** incluir lógica de negócio nas entidades.
- **Não** injetar ou usar serviços, repositórios ou outros módulos.
- **Apenas** definição de colunas (`@Column`), chaves (`@PrimaryGeneratedColumn`), datas (`@CreateDateColumn`, `@UpdateDateColumn`), relações (`@ManyToOne`, `@OneToMany`, etc.) e índices (`@Index`).

## Export central

Todas as entidades devem ser exportadas em **`index.ts`** para importação única:

```ts
import { User, Organization, Contact } from '../../entities';
// ou
import { User, Organization, Contact } from '@/entities';
```

## Entidades atuais

- **User** — Usuário do sistema (email, nome, senha, preferências).
- **Organization** — Organização (tenant).
- **OrganizationUser** — Vínculo usuário–organizacao (role por tenant).
- **AuditLog** — Log de auditoria.
- **Contact** — Contato: o registro central do CRM (lead, prospect ou cliente). É o CRUD de referência do template.
- **ContactEmail** / **ContactPhone** — N e-mails e N telefones por contato; `contacts.primary_email`/`primary_phone` são cópias desnormalizadas da linha primária.
- **CustomFieldDefinition** / **ContactFieldValue** — campos customizados por organização (EAV com colunas TIPADAS: `value_text`, `value_number`, `value_date`, `value_boolean`, `value_options` jsonb).
- **Plan** — plano contratado (limites de quota).

## Novas entidades

1. Criar arquivo `<nome>.entity.ts` com decorators TypeORM (`@Entity`, `@Column`, etc.).
2. Adicionar export em **`index.ts`**.
3. Registrar a entidade no **DatabaseModule** (TypeORM) em `database/database.module.ts` (ou equivalente no projeto).
4. Criar repositório em `src/repositories/<nome>.repository.ts` para acesso a dados.

Referência completa de camadas e convenções: **`src/README.md`** e **`backend/AGENTS.md`**.
