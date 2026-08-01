/**
 * Tipos comuns
 */

export interface Location {
  latitude: string;
  longitude: string;
  city?: string;
}

export type IDateValue = string | number | null;

export type IPaymentCard = {
  id: string;
  cardType: string;
  primary?: boolean;
  cardNumber: string;
};
