import React, { createContext, useContext, useEffect, useState } from 'react';

import { loginRequest } from '@/lib/api';
import { clearCachedResponses } from '@/lib/offline-cache';
import { deleteToken, getToken, saveToken } from '@/lib/secure-storage';

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  // The password used for this session's login, kept in memory only so the
  // forced first-login password change doesn't have to ask for it again.
  // null after an app restart (the token survives, this doesn't).
  loginPassword: string | null;
  clearLoginPassword: () => void;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginPassword, setLoginPassword] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((stored) => {
      setToken(stored);
      setIsLoading(false);
    });
  }, []);

  async function login(username: string, password: string): Promise<LoginResult> {
    const result = await loginRequest({ username, password });
    if (result.ok) {
      await clearCachedResponses();
      await saveToken(result.data.token);
      setLoginPassword(password);
      setToken(result.data.token);
      return { success: true };
    }
    return { success: false, message: result.error.message };
  }

  async function logout(): Promise<void> {
    await deleteToken();
    await clearCachedResponses();
    setLoginPassword(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoading,
        loginPassword,
        clearLoginPassword: () => setLoginPassword(null),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
