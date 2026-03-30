import React, { createContext, useContext, useState } from 'react';
import { login as loginApi, register as registerApi } from '../api/authApi';
import { updateUser } from '../api/usersApi';

interface User {
  id: string;
  username: string;
  email: string;
  profileUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const loadFromStorage = (): AuthState => {
  try {
    const raw = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    return {
      user: raw ? JSON.parse(raw) : null,
      accessToken,
    };
  } catch {
    return { user: null, accessToken: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(loadFromStorage);

  const persist = (user: User | null, accessToken: string | null) => {
    if (user && accessToken) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
    setState({ user, accessToken });
  };

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await loginApi(email, password);
    persist(user, accessToken);
  };

  const register = async (username: string, email: string, password: string) => {
    const { accessToken, user } = await registerApi(username, email, password);
    persist(user, accessToken);
  };

  const logout = () => persist(null, null);

  const updateProfile = async (data: FormData) => {
    if (!state.user) return;
    const updated = await updateUser(state.user.id, data);
    persist({ ...state.user, username: updated.username, profileUrl: updated.profileUrl }, state.accessToken);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
