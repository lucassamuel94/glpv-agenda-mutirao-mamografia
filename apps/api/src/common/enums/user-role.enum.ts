/**
 * Enum para roles de usuário
 */
export enum UserRole {
  // SUPER ADMIN (Nível 0)
  SUPER_ADMIN = 'SUPER_ADMIN',
  SA_MASTER = 'SA_MASTER',
  SA_BILLING = 'SA_BILLING',
  SA_USER = 'SA_USER',

  // EMPRESA (Nível 1)
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COORDINATOR = 'COORDINATOR',
  USER = 'USER',
}
