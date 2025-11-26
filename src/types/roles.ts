export const USER_ROLES = [
  'admin',
  'commerciale',
  'lettore',
  'production',
  'sales',
  'customer_user',
  'lab'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_OR_LAB: UserRole[] = ['admin', 'lab'];


