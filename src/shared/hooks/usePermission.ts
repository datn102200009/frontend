import { useCurrentUser } from '../lib/permissionContext';

export function usePermission(permissionCode: string): boolean {
  const user = useCurrentUser();
  if (!user) return false;

  return user.permissions?.includes(permissionCode) || false;
}
