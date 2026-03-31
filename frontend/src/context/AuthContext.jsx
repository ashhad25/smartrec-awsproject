// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('smartrec_token'));
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      if (token) {
        try {
          const res = await authAPI.me();
          setUser(res.user);
        } catch {
          localStorage.removeItem('smartrec_token');
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Load all demo users for the user-switcher
  useEffect(() => {
    authAPI.listUsers().then(res => setAllUsers(res.users)).catch(() => {});
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('smartrec_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    localStorage.setItem('smartrec_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smartrec_token');
    setToken(null);
    setUser(null);
  }, []);

  const switchUser = useCallback(async (email) => {
  const PASSWORDS = {
    'ashhad.ahmed72@unb.ca': 'ashhad@2012105',
  };
  const password = PASSWORDS[email] || 'password';
  const res = await authAPI.login(email, password);
  localStorage.setItem('smartrec_token', res.token);
  setToken(res.token);
  setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, allUsers, login, register, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
