import React from 'react';
import { useCurrentUser } from '../../lib/permissionContext';

export interface PermissionGuardProps {
  requiredPermission?: string;
  requiredPermissions?: string[];
  operator?: 'AND' | 'OR';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  requiredPermission,
  requiredPermissions,
  operator = 'AND',
  fallback = null,
  children,
}: PermissionGuardProps) {
  const user = useCurrentUser();

  if (!user) {
    return <>{fallback}</>;
  }

  // Admin has all permissions
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  const permissions = user.permissions || [];

  if (requiredPermission) {
    if (permissions.includes(requiredPermission)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.map((p) => permissions.includes(p));

    const isAllowed =
      operator === 'AND'
        ? hasPermissions.every((val) => val)
        : hasPermissions.some((val) => val);

    if (isAllowed) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
