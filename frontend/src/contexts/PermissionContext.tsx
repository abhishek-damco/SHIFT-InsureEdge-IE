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
  // When permissions have loaded but screen has no entry, default to true
  // so the UI is fully usable without a permissions backend.
  const defaultVal = ctx.loaded ? true : false;
  return {
    loaded: ctx.loaded,
    view: screen?.view ?? defaultVal,
    add: screen?.add ?? defaultVal,
    edit: screen?.edit ?? defaultVal,
    duplicate: screen?.duplicate ?? defaultVal,
    upload: screen?.upload ?? defaultVal,
    download: screen?.download ?? defaultVal,
    sensitiveData: screen?.sensitiveData ?? defaultVal,
    sensitiveDocuments: screen?.sensitiveDocuments ?? defaultVal,
    approveReject: screen?.approveReject ?? defaultVal,
  };
}
