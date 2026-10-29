import React, { createContext, useContext, useEffect, useState } from 'react';

import { loginRequest, setUnauthorizedHandler } from '@/lib/api';
import { clearCachedResponses } from '@/lib/offline-cache';
import { deleteToken, getToken, saveToken } from '@/lib/secure-storage';

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

const SIGNED_OUT_MESSAGE = "You've been signed out. Log in again.";

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  // The password used for this session's login, kept in memory only so the
  // forced first-login password change doesn't have to ask for it again.
  // null after an app restart (the token survives, this doesn't).
  loginPassword: string | null;
  clearLoginPassword: () => void;
  // Why the API ended the session, for the login screen; null after a normal logout.
  signedOutMessage: string | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginPassword, setLoginPassword] = useState<string | null>(null);
  const [signedOutMessage, setSignedOutMessage] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((stored) => {
      setToken(stored);
      setIsLoading(false);
    });
  }, []);

  // A 401 for the current token means the owner set a new password, turned the
  // account off, or the plan paused it. A 401 for an older token is ignored.
  useEffect(() => {
    if (!token) return;
    setUnauthorizedHandler((rejected, message) => {
      if (rejected !== token) return;
      // Laravel's plain "Unauthenticated." says nothing useful to the user.
      setSignedOutMessage(message && message !== 'Unauthenticated.' ? message : SIGNED_OUT_MESSAGE);
      deleteToken();
      clearCachedResponses();
      setLoginPassword(null);
      setToken(null);
    });
    return () => setUnauthorizedHandler(null);
  }, [token]);

  async function login(username: string, password: string): Promise<LoginResult> {
    setSignedOutMessage(null);
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
    setSignedOutMessage(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoading,
        loginPassword,
        clearLoginPassword: () => setLoginPassword(null),
        signedOutMessage,
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
