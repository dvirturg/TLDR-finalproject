import axiosInstance from './axiosInstance';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  profileUrl?: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await axiosInstance.post<AuthResponse>('/user/login', { email, password });
  return data;
};

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const { data } = await axiosInstance.post<AuthResponse>('/user/register', {
    username,
    email,
    password,
  });
  return data;
};

export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  const { data } = await axiosInstance.post<AuthResponse>('/user/google-login', { idToken });
  console.log('Google login response:', data);
  return data;
};