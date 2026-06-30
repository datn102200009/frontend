import { createContext, useContext } from 'react';

export interface SharedUser {
  id: string;
  username: string;
  full_name: string;
  permissions: string[];
}

export const PermissionContext = createContext<SharedUser | null>(null);
export const useCurrentUser = () => useContext(PermissionContext);
