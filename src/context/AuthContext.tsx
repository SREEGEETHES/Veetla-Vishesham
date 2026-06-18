import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isApproved: boolean;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('familyos_token');
    if (storedToken) {
      setToken(storedToken);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          if (res.status === 401) {
            localStorage.removeItem('familyos_token');
            setToken(null);
            setUser(null);
          }
          throw new Error('Auth check failed');
        })
        .then((data) => {
          setUser(data.user || data);
        })
        .catch(() => {
          localStorage.removeItem('familyos_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('familyos_token', newToken);
    localStorage.setItem('familyos_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('familyos_token');
    localStorage.removeItem('familyos_user');
    setToken(null);
    setUser(null);
  };

  const authFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers }).then((res) => {
      if (res.status === 401) {
        logout();
        return res;
      }
      return res;
    });
  };

  const isAdmin = user?.role === 'admin';
  const isApproved = user?.approved === true;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin, isApproved, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}