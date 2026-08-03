// ============================================
// Base Entities (Auth, multi-tenancy, audit)
// ============================================
export { User } from './user.entity';
export { Plan, PlanLimits, PlanLimitsKey } from './plan.entity';
export { Organization, OrganizationStatus, PLATFORM_TENANT_ID } from './organization.entity';
export { OrganizationUser } from './organization-user.entity';
export { AuditLog } from './audit-log.entity';
export { Clinic } from './clinic.entity';
export { Slot, SlotStatus } from './slot.entity';
export { Patient } from './patient.entity';
export { Offer, OfferOutcome } from './offer.entity';
export {
  Appointment,
  AppointmentChannel,
  AppointmentStatus,
  CancellationReason,
} from './appointment.entity';
export { WaitingListEntry } from './waiting-list-entry.entity';
export { IdempotencyRecord } from './idempotency-record.entity';

// ============================================
// Fonte única da lista de entities
// ============================================

import { User } from './user.entity';
import { Plan } from './plan.entity';
import { Organization } from './organization.entity';
import { OrganizationUser } from './organization-user.entity';
import { AuditLog } from './audit-log.entity';
import { Clinic } from './clinic.entity';
import { Slot } from './slot.entity';
import { Patient } from './patient.entity';
import { Offer } from './offer.entity';
import { Appointment } from './appointment.entity';
import { WaitingListEntry } from './waiting-list-entry.entity';
import { IdempotencyRecord } from './idempotency-record.entity';

/**
 * Toda entity do app, em UM lugar. Quem precisa da lista consome daqui:
 * as 3 conexões do `DatabaseModule` (`forRootAsync` e `forFeature`) e o
 * `scripts/recreate-dev-db.ts`.
 *
 * **Entity nova entra aqui.** É a única lista que existe — antes eram 7 cópias
 * escritas à mão, e a do script ficou com 7 de 11. O estrago não era visível:
 * o `synchronize` criava schema sem as tabelas filhas, e o `policies.sql`
 * seguinte falhava no meio, e por ser aplicado num único `query()` (transação
 * implícita), o Postgres desfazia o lote todo — `npm run db:recreate`
 * devolvia um banco sem RLS e sem os índices únicos, sem reclamar.
 *
 * `src/entities/all-entities.spec.ts` trava isso: descobre as entities pelo
 * filesystem e falha se alguma ficar fora daqui.
 */
/**
 * Classe de entity do TypeORM. Existe porque `Function` como tipo é proibido
 * pelo lint (`ban-types`) e porque um construtor tipado documenta melhor a
 * intenção: aqui só entram classes decoradas com `@Entity`.
 */
export type EntityClass = new (...args: never[]) => object;

// Array mutável (não `as const`): `TypeOrmModule.forFeature` exige mutável.
export const ALL_ENTITIES: EntityClass[] = [
  User,
  Plan,
  Organization,
  OrganizationUser,
  AuditLog,
  Clinic,
  Slot,
  Patient,
  Offer,
  Appointment,
  WaitingListEntry,
  IdempotencyRecord,
];
