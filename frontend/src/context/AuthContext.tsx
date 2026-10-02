import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, getAuthUser, getAuthToken, removeAuthToken, removeAuthUser, setAuthToken, setAuthUser, apiFetch } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getAuthUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiFetch('/auth/me');
          setUser(res.user);
          setAuthUser(res.user);
        } catch (error) {
          console.error('Failed to verify token', error);
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(res.token);
    setAuthUser(res.user);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    removeAuthUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
