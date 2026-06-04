import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) ?? null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const isAuthenticated = !!user && !!localStorage.getItem('auth_token');

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin(username, password);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user',  JSON.stringify({ username: data.username }));
      setUser({ username: data.username });
      return true;
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Login gagal. Coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
