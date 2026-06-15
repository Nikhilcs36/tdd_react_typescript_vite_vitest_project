// Default auth fields for loginSuccess dispatch in tests
export const defaultAuthFields = {
  logins_remaining_for_staff: 0,
  staff_access_granted: true,
  active_role: 'superuser' as const,
  role_label: 'Superuser',
};