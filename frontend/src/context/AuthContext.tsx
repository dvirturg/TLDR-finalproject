import React, { createContext, useContext, useState } from 'react';
import { googleLogin as googleLoginApi, login as loginApi, register as registerApi, logout as logoutApi } from '../api/authApi';
import { updateUser } from '../api/usersApi';
import { setAuthTokens } from '../api/axiosInstance';

interface User {
  id: string;
  username: string;
  email: string;
  profileUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
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
    const refreshToken = localStorage.getItem('refreshToken');
    return {
      user: raw ? JSON.parse(raw) : null,
      accessToken,
      refreshToken,
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(loadFromStorage);

  const persist = (user: User | null, accessToken: string | null, refreshToken: string | null = null) => {
    if (user && accessToken && refreshToken) {
      localStorage.setItem('user', JSON.stringify(user));
      setAuthTokens(accessToken, refreshToken);
    } else {
      localStorage.removeItem('user');
      setAuthTokens(null, null);
    }
    setState({ user, accessToken, refreshToken });
  };

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken, user } = await loginApi(email, password);
    persist(user, accessToken, refreshToken);
  };

  const register = async (username: string, email: string, password: string) => {
    const { accessToken, refreshToken, user } = await registerApi(username, email, password);
    persist(user, accessToken, refreshToken);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch (error) {
        // Continue with logout even if API call fails
        if (import.meta.env.DEV) {
          console.error('Logout API failed:', error);
        }
      }
    }
    persist(null, null, null);
  };

  const updateProfile = async (data: FormData) => {
    if (!state.user) return;
    const updated = await updateUser(state.user.id, data);
    persist({ ...state.user, username: updated.username, profileUrl: updated.profileUrl }, state.accessToken, state.refreshToken);
  };

  const loginWithGoogle = async (idToken: string) => {
    const { accessToken, refreshToken, user } = await googleLoginApi(idToken);
    persist(user, accessToken, refreshToken);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
