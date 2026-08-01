/**
 * Tipos de organização
 */

import type { Subscription } from "./subscription";

export interface Organization {
  id: string;
  nameFantasy: string;
  phoneContact: string;
  cnpj: string;
  contractSocial: string;
  transportCategory: string;
  isActive: boolean;
  isCompleted: boolean;
  isOn: boolean;
  photoUrl: string;
  antt: string;
  state: string;
  street: string;
  number: string;
  zipcode: string;
  city: string;
  subscription?: Subscription | null;
}

export interface OrganizationUser extends Organization {
  cpf: string;
  name: string;
  phoneNumber?: string;
  photoFaceURL?: string;
}
