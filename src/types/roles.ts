export const USER_ROLES = [
  'admin',
  'commerciale',
  'amministrazione',
  'lettore',
  'production',
  'sales',
  'customer_user',
  'lab'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_OR_LAB: UserRole[] = ['admin', 'lab'];

// Ruoli che possono gestire vendite (ordini, listini, fatture)
export const SALES_ROLES: UserRole[] = ['admin', 'commerciale', 'amministrazione'];


