import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

interface User {
  id: number;
  email: string;
  is_active: boolean;
  roles: Array<{ id: number; name: string }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
    setToken(null);
  };

  const fetchUser = async () => {
    try {
      const res = await client.get('/auth/me');
      setUser(res.data.user);
    } catch {
      await SecureStore.deleteItemAsync('token');
      setUser(null);
      setToken(null);
    }
  };

  const login = async (newToken: string) => {
    await SecureStore.setItemAsync('token', newToken);
    setToken(newToken);
    await fetchUser();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('token');
        if (stored && !cancelled) {
          setToken(stored);
          await fetchUser();
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
