// ADR-009: Fetches all screen permissions once after login via /api/auth/me/permissions
// Exposes usePermissions(screenCode) hook for components to check per-type access.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { ScreenPermissionsDto } from '../types/Permission';

interface PermissionContextValue {
  permissions: ScreenPermissionsDto[];
  loaded: boolean;
  getScreen: (screenCode: string) => ScreenPermissionsDto | null;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  loaded: false,
  getScreen: () => null,
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<ScreenPermissionsDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    authApi.getMyPermissions()
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoaded(true));
  }, []);

  const getScreen = (screenCode: string) =>
    permissions.find(p => p.screen === screenCode) ?? null;

  return (
    <PermissionContext.Provider value={{ permissions, loaded, getScreen }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(screenCode: string) {
  const ctx = useContext(PermissionContext);
  const screen = ctx.getScreen(screenCode);
  return {
    loaded: ctx.loaded,
    view: screen?.view ?? false,
    add: screen?.add ?? false,
    edit: screen?.edit ?? false,
    duplicate: screen?.duplicate ?? false,
    upload: screen?.upload ?? false,
    download: screen?.download ?? false,
    sensitiveData: screen?.sensitiveData ?? false,
    sensitiveDocuments: screen?.sensitiveDocuments ?? false,
    approveReject: screen?.approveReject ?? false,
  };
}
