import { createContext, useContext } from 'react';

export interface SharedUser {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
}

export const PermissionContext = createContext<SharedUser | null>(null);
export const useCurrentUser = () => useContext(PermissionContext);
