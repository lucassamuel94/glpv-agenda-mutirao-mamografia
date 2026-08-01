/**
 * Tipos e modelos relacionados ao domínio de assinaturas NFretes.
 * Referências extraídas da versão beta (front-end legado) para manter compatibilidade.
 */

export enum SubscriptionStates {
  ACTIVE = 1,
  CANCELED = 2,
  OVERDUE = 3,
}

export type SubscriptionBillingCycle =
  | "MONTHLY"
  | "ANNUALLY"
  | "TRIAL"
  | string;

export interface SubscriptionPlanMeta {
  id: string;
  name: string;
  description?: string;
  billingCycle?: SubscriptionBillingCycle;
  value?: number;
  isTrial?: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStates;
  merchantOrderId: string | null;
  planId: string;
  organizationId: string;
  amount: number;
  nextRecurrency: Date | string;
  endDate: Date | string;
  interval: number | string;
  trialStartDate?: Date | string;
  trialEndDate?: Date | string;
  isInTrial?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  plan?: SubscriptionPlanMeta | null;
}

export interface SubscriptionBenefit {
  name: string;
  quantityUsed: number;
  limit: number | null;
  remaining: number | null;
  description?: string;
  isUnlimited?: boolean;
}

export interface SubscriptionCreditCard {
  id: string;
  lastFourDigits: string;
  brand: string;
  holderName?: string;
  expirationMonth?: string;
  expirationYear?: string;
  isDefault?: boolean;
  updatedAt?: Date | string;
}

export interface SubscriptionTransaction {
  id: string;
  createdAt: Date | string;
  status: "PAID" | "PENDING" | "FAILED" | string;
  description?: string;
  amount?: number;
  invoiceUrl?: string;
}

export interface SubscriptionProrataQuote {
  planId: string;
  amount: number;
  description?: string;
  currency?: string;
}

/* ─── Types de API ───────────────────────────────────── */

export interface SubscriptionTransactionsResponse {
  data: SubscriptionTransaction[];
  meta?: {
    page: number;
    totalPages: number;
    totalItems?: number;
    perPage?: number;
  };
}

export interface CreditCardPayload {
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}
