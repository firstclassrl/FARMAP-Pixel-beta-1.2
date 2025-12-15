export const USER_ROLES = [
  'admin',
  'commerciale',
  'amministrazione',
  'lettore',
  'production',
  'sales',
  'customer_user',
  'lab',
  'warehouse'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_OR_LAB: UserRole[] = ['admin', 'lab'];

// Ruoli che possono gestire vendite (ordini, listini, fatture)
export const SALES_ROLES: UserRole[] = ['admin', 'commerciale', 'amministrazione'];

// Ruoli che possono operare sul magazzino (carichi/scarichi)
export const WAREHOUSE_ROLES: UserRole[] = ['admin', 'warehouse', 'amministrazione'];

// Ruoli che possono vedere le giacenze (solo lettura)
export const WAREHOUSE_VIEW_ROLES: UserRole[] = [
  'admin',
  'commerciale',
  'sales',
  'amministrazione',
  'warehouse'
];


