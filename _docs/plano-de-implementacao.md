# Plano de Implementação — Mutirão de Mamografia 2026

Base: `_docs/regras-de-negocio-mutirao-mamografia-2026-v2.0.md` (RN-01 a RN-67).
Estado atual: `ez-starter-kit` — NestJS + TypeORM + PostgreSQL (RLS, auditoria, JWT, CLS multi-tenant) e Next.js. **Zero código de domínio existe.** Todo o mutirão é feature nova sobre a base.

---

## 0. Decisões de arquitetura (o que NÃO vamos construir)

| Decisão | Motivo |
|---|---|
| Reusar `UserRole` existente: `ATENDENTE` = `USER`, `ADM` = `ADMIN` | RN-53/54 são exatamente as duas roles já suportadas pelo `RolesGuard`. Novo enum = migração + policies + zero ganho. |
| Uma organização única (o mutirão) — multi-tenancy fica intacta, não é exercitada | Remover a infra de tenant custa mais que mantê-la. Tabelas novas levam `organization_id` + RLS igual às existentes. |
| Reserva mora em colunas do próprio `slot`, sem tabela `reserva` | RN-16..19 e RN-24 descrevem estado da vaga, não entidade. |
| Sem tabela de lembrete — resposta vira evento em `audit_logs` + flag no agendamento | RN-47 diz que o disparo é do EZ Chat. A API só recebe resposta. |
| Idempotência genérica (uma tabela + um interceptor), não por endpoint | RN-62 pede o mesmo comportamento em 3 fluxos. |
| Concorrência por constraint/lock no banco, não por validação no service | RN-61 exige isso explicitamente. |
| Sem tela de CRUD de agenda | RN-15 proíbe no MVP. Carga é script. |
| Expiração de reserva por **predicado de consulta**, cron só para higiene | Vaga expirada já é elegível na próxima consulta; o cron existe só para os números do dashboard (RN-22 conta `RESERVADAS`) não ficarem inflados. |

**Ponto em aberto para o cliente:** RN-54 pede "relatório Excel". Proposta: CSV com BOM UTF-8 (abre no Excel, zero dependência). Se `.xlsx` real for requisito contratual, entra `exceljs`. Decidir antes da Fase 6.

---

## 1. Modelo de dados

Oito tabelas novas (`entities/` + `index.ts` + `DatabaseModule` + repositório, conforme `apps/api/src/README.md`), uma migration por fase.

### `clinic` — RN-09, RN-10, RN-20
`id`, `organization_id`, `name`, `capacity int`, `address`, `phone`, `whatsapp`, `active`.
Capacidades vêm de seed **configurável**, não hardcoded — Pro-Imagem/IME ainda indefinidas (Pendência 1).

### `slot` — RN-11, RN-16..19
`id`, `organization_id`, `clinic_id`, `slot_at timestamp` (sem timezone, RN-60), `status` (`LIVRE`|`RESERVADA`|`OCUPADA`), `reserved_until timestamp null`, `reserved_by_offer_id null`.
- `UNIQUE (clinic_id, slot_at)` → RN-12 (horário duplicado na mesma clínica) e RN-11 (mesmo horário em clínicas diferentes continua válido).
- `CHECK (extract(isodow from slot_at) BETWEEN 1 AND 5)` → RN-08 dias úteis, no banco.
- `CHECK (slot_at::date BETWEEN '2026-09-08' AND '2026-10-30')` → RN-08 janela.
- Índice parcial em `(clinic_id, slot_at) WHERE status='LIVRE'`.

### `patient` — RN-04, RN-05
`id`, `organization_id`, `full_name`, `normalized_name`, `birth_date date`, `phone`, `alt_phone`, `bot_blocked boolean default false`.
- `normalized_name` gravado pela API (`normalizeName()` em `common/utils/`): `NFD` → remove diacríticos → `toUpperCase` → colapsa espaços → trim. Stdlib JS, sem extensão `unaccent` no Postgres.
- `INDEX (normalized_name, birth_date)` — não UNIQUE: RN-66/RN-07 exigem que homônima com mesma data caia em fila humana, não em erro.

### `offer` — RN-21, RN-24, RN-26, RN-27
`id`, `organization_id`, `conversation_id`, `patient_id`, `slot_id`, `created_at`, `expires_at`, `outcome` (`PENDENTE`|`ACEITA`|`RECUSADA`|`EXPIRADA`).
Serve de contador de ofertas por conversa (RN-26) e de lista de recusadas (RN-27) sem tabela extra.

### `appointment` — RN-06, RN-28..30, RN-35..40
`id`, `organization_id`, `patient_id`, `slot_id`, `offer_id null`, `protocol char(6)`, `status` (`CONFIRMADO`|`CANCELADO`), `channel` (`BOT`|`PAINEL`), `cancel_reason` (`ERRO_OPERACIONAL`|`DESISTENCIA`|`AUSENCIA_CONFIRMADA`), `canceled_at`, `canceled_by`, `pending_absence_confirmation boolean default false`, `created_by`.
- `UNIQUE (protocol)` → RN-30.
- `UNIQUE (offer_id) WHERE offer_id IS NOT NULL` → RN-29 idempotência sai de graça: reenviar a mesma oferta bate na constraint, o service devolve o agendamento existente.
- `UNIQUE (patient_id) WHERE status='CONFIRMADO'` → RN-06 no banco.
- `UNIQUE (slot_id) WHERE status='CONFIRMADO'` → RN-61, duas confirmações concorrentes na mesma vaga: uma falha.
- Cancelamento é `UPDATE` de status, nunca `DELETE` (RN-40).

### `waiting_list_entry` — RN-43..46
`id`, `organization_id`, `patient_id`, `phone`, `alt_phone`, `entered_at`, `contacted_at null`, `removed_at null`, `notes`. Ordenação padrão `entered_at ASC`. Remoção é soft (`removed_at`) — RN-45 pede histórico.

### `idempotency_record` — RN-62
`key varchar PK`, `endpoint`, `response_body jsonb`, `created_at`. Interceptor lê header `Idempotency-Key`; se existe, devolve a resposta gravada sem executar o handler.

### `audit_logs` (existente) — RN-56, RN-57
Já registra autor, timestamp, entidade, ação, valores. Basta anotar os endpoints novos com o padrão do `AuditInterceptor` atual. RN-58: nenhum dado pessoal em path/query — busca de paciente é `POST /patients/search` com body, consulta por protocolo é `POST /appointments/lookup` (protocolo + data de nascimento no body, RN-31).

---

## 2. Fases

### Fase 1 — Fundação de dados (bloqueia tudo)
1. As 8 entidades + repositórios + registro no `DatabaseModule`.
2. Migration `...-MutiraoSchema.ts` com todas as constraints/índices parciais acima (TypeORM não gera índice parcial: escrever no `up()` à mão).
3. RLS: adicionar as 7 tabelas com `organization_id` ao `database/rls/policies.sql` — `parse-policy-tables.ts` já deriva a lista de lá, então o teste de boot passa a cobri-las sozinho.
4. `normalizeName()` + spec.
5. Seed de clínicas (`scripts/seed-clinics.ts`), capacidades por parâmetro.

**Aceite:** `pnpm --filter api test` verde; `db:recreate` sobe o schema; RLS verifier cobre as novas tabelas.

### Fase 2 — Carga da agenda (RN-12..15, Pendências 2 e 3)
Script `scripts/load-slots.ts <clinica> <arquivo.csv>`:
- Modo padrão = **dry-run** com relatório: total, por data, fora da janela, fim de semana, duplicados, diferença para a capacidade configurada.
- `--commit` só grava se o relatório estiver 100% limpo (RN-12).
- Recusa explicitamente a planilha atual da Radioclínica enquanto tiver os 62 sábados (RN-13); nada de mesclar com a imagem de referência (RN-14).

**Aceite:** rodar contra a planilha atual da Radioclínica reprova e lista os 8 sábados; rodar contra grade corrigida de 500 vagas aprova.

### Fase 3 — Núcleo de agendamento (RN-01..07, 16..33)
Módulo `modules/scheduling/`:
- `SlotService.pickClinic()` — RN-22/23: menor `(ocupadas+reservadas)/capacidade`, desempate por absoluto, depois por `id`.
- `OfferService.createOffer(conversationId, patientId)` — RN-20/21/24/26/27. Seleção da vaga em transação com `SELECT ... FOR UPDATE SKIP LOCKED`, marca `RESERVADA` + `reserved_until = now() + 10min`. Reoferta: exclui `slot_id` já recusados na conversa, prioriza outro dia → outro turno → qualquer livre. Na 3ª recusa devolve `handoff: true` (RN-26).
- `AppointmentService.confirm(offerId, idempotencyKey)` — RN-28/29: usa a vaga da oferta, nunca recalcula; oferta expirada → erro `OFFER_EXPIRED` que instrui nova oferta (RN-25).
- `generateProtocol()` — 6 chars do alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sem O/0/I/1/L), retry em colisão (RN-30).
- Elegibilidade: idade **na data do exame** (RN-01) e autodeclaração de mamografia < 12 meses (RN-02/63) revalidadas no service, qualquer canal (RN-03).
- `@Cron('*/1 * * * *')` (`@nestjs/schedule`, já instalado) libera reservas vencidas.

**Aceite:** teste de concorrência — N confirmações paralelas na mesma vaga, exatamente 1 sucesso; confirmação repetida com mesma oferta devolve o mesmo protocolo.

### Fase 4 — Cancelamento e lembrete (RN-34..42, 47..52)
- `cancel(appointmentId, reason, actor)`: libera vaga (`LIVRE`), grava motivo/autor/timestamp, e `DESISTENCIA`/`AUSENCIA_CONFIRMADA` setam `patient.bot_blocked = true` (RN-37/38). `ERRO_OPERACIONAL` não bloqueia (RN-36). O bloqueio só barra o canal `BOT`; painel ignora (RN-39).
- Dupla confirmação (RN-41/42/51) como **máquina de dois passos**: `POST /bot/reminder-response {absent:true}` apenas seta `pending_absence_confirmation = true` e devolve o texto da pergunta — o agendamento continua `CONFIRMADO`. Só `POST /bot/absence-confirmation {confirmed:true}` cancela. `confirmed:false`, timeout ou resposta não reconhecida limpam a flag e mantêm o agendamento.
- Sem reagendamento (RN-34): não existe endpoint de update de vaga.

**Aceite:** teste cobrindo os 4 caminhos do lembrete (compareço / não compareço→sim / não compareço→não / não compareço→silêncio); só o segundo cancela.

### Fase 5 — Lista de espera (RN-43..46)
CRUD fino sobre `waiting_list_entry` + endpoint chamado ao fim do fluxo de cancelamento do bot. Ordenação padrão por `entered_at`. Sem automação de convocação (RN-46 é contato manual).

### Fase 6 — Painel (RN-53, 54, 59)
Views novas em `apps/web/src/views/` + rotas em `app/(protected)/`, seguindo `Reports.tsx`/`DataTable.tsx`:
- `/agenda` — grade por clínica/dia, vaga livre clicável → agendamento manual (RN-32: mesmas regras, sem balanceamento).
- `/pacientes` — busca (`POST`, RN-58), histórico, cancelamento com motivo.
- `/lista-espera` — RN-45.
- `/dashboard-mutirao` (`ADM`) — RN-59: por clínica e consolidado — capacidade, livres, reservadas, ocupadas, confirmações, cancelamentos por motivo, lista de espera. Uma query agregada, sem view materializada até o volume exigir.
- Exportação do relatório (formato conforme decisão do §0).

### Fase 7 — Integração EZ Chat (RN-55)
- `ApiKeyGuard` novo + `@BotEndpoint()`, escopo restrito ao prefixo `/bot/*` (RN-55). Chave em env, comparação com `timingSafeEqual`.
- Endpoints do bot: `offer`, `offer/decline`, `confirm`, `lookup`, `reminder-response`, `absence-confirmation`, `waiting-list`. Todos idempotentes via header.
- Payload de confirmação repete protocolo, clínica, endereço, data, hora e contatos (RN-33).
- Textos das mensagens em `common/templates/` — pendentes de aprovação (Pendência 5), com o texto do §3.7 do documento como default.

### Fase 8 — Fechamento
- Testes de integração (`test/integration/`) para os critérios de aceite do §6 do documento.
- Convenção de timezone (RN-60) documentada no README: `timestamp` sem timezone = horário de parede `America/Sao_Paulo`; API já roda `TZ=UTC`, nenhuma conversão em nenhuma camada.
- Checklist de publicação = as 5 pendências obrigatórias do §5.

---

## 3. Rastreabilidade RN → fase

| Fase | RN cobertas |
|---|---|
| 1 | 04, 05, 09, 10, 11, 16, 56, 57, 58, 60 |
| 2 | 08, 12, 13, 14, 15 |
| 3 | 01, 02, 03, 06, 07, 17–33, 61, 62 |
| 4 | 34–42, 47–52, 64 |
| 5 | 43–46 |
| 6 | 32, 53, 54, 59 |
| 7 | 20, 33, 55 |
| 8 | 63, 65, 66, 67 (limitações documentadas, sem código) |

---

## 4. Bloqueios externos

Nada nas Fases 1–8 depende das pendências, **exceto**: a Fase 2 não fecha sem as grades reais (Pendências 2 e 3) e o seed de capacidade fica parametrizado até a Pendência 1. Desenvolvimento segue com grades sintéticas válidas; publicação não.
