import React, { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
  token: string;
}

interface AuthContextType {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      const { token } = response;
      const user = { id: response.id, email: response.email };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setSession({ token, user });
    } catch (error: any) {
      // Throw the error message directly
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await api.auth.register(email, password);
      await signIn(email, password);
    } catch (error: any) {
      // Throw the error message directly
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}