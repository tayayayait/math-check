/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { DemoSessionDto } from "../../contracts/dto";
import type { Role } from "../../contracts/domain";
import { useAppRepository } from "../../services/data-provider";
import type { LoginInput, ChangePasswordInput } from "../../contracts/inputs";

export interface DemoSessionContextValue {
  session: DemoSessionDto | null;
  isLoading: boolean;
  role: Role | null;
  actorId: string | null;
  mustChangePassword: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchActor: (actorId: string) => Promise<boolean>;
  changePassword: (input: ChangePasswordInput) => Promise<{ success: boolean; message?: string }>;
  refreshSession: () => Promise<void>;
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export interface DemoSessionProviderProps {
  children: React.ReactNode;
}

export function DemoSessionProvider({ children }: DemoSessionProviderProps) {
  const repository = useAppRepository();
  const [session, setSession] = useState<DemoSessionDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await repository.getSession();
      if ("data" in res) {
        setSession(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (input: LoginInput): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const res = await repository.login(input);
        if ("data" in res) {
          setSession(res.data);
          return { success: true };
        }
        return { success: false, message: res.error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [repository],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await repository.logout();
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  }, [repository, refreshSession]);

  const switchActor = useCallback(
    async (actorId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await repository.setDemoSession(actorId);
        if ("data" in res) {
          setSession(res.data);
          return true;
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [repository],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput): Promise<{ success: boolean; message?: string }> => {
      const res = await repository.changePassword(input);
      if ("data" in res) {
        await refreshSession();
        return { success: true };
      }
      return { success: false, message: res.error.message };
    },
    [repository, refreshSession],
  );

  const value: DemoSessionContextValue = {
    session,
    isLoading,
    role: session?.role ?? null,
    actorId: session?.actorId ?? null,
    mustChangePassword: session?.mustChangePassword ?? false,
    login,
    logout,
    switchActor,
    changePassword,
    refreshSession,
  };

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession(): DemoSessionContextValue {
  const context = useContext(DemoSessionContext);
  if (!context) {
    throw new Error("useDemoSession must be used within a DemoSessionProvider");
  }
  return context;
}
