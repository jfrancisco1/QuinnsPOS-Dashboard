import React, { createContext, useContext, useEffect, useState } from 'react';

import { loginRequest } from '@/lib/api';
import { deleteToken, getToken, saveToken } from '@/lib/secure-storage';

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((stored) => {
      setToken(stored);
      setIsLoading(false);
    });
  }, []);

  async function login(username: string, password: string): Promise<LoginResult> {
    const result = await loginRequest({ username, password });
    if (result.ok) {
      await saveToken(result.data.token);
      setToken(result.data.token);
      return { success: true };
    }
    return { success: false, message: result.error.message };
  }

  async function logout(): Promise<void> {
    await deleteToken();
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
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
