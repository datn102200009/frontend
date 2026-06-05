import { useSelector } from 'react-redux';
import type { RootState } from '@app/store';

export function usePermission(permissionCode: string): boolean {
  const user = useSelector((s: RootState) => s.auth.user);
  if (!user) return false;

  return user.permissions?.includes(permissionCode) || false;
}
