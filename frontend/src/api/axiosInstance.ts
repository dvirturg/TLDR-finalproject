import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let currentAccessToken = localStorage.getItem('accessToken');
let currentRefreshToken = localStorage.getItem('refreshToken');

export const setAuthTokens = (accessToken: string | null, refreshToken: string | null) => {
  currentAccessToken = accessToken;
  currentRefreshToken = refreshToken;

  if (accessToken && refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailed: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.onFailed(error);
    } else {
      prom.onSuccess(token!);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

// Request interceptor - Add access token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = currentAccessToken ?? localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401, reject immediately
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loops - don't retry refresh endpoint itself
    if (originalRequest.url?.includes('/user/refresh') || originalRequest._retry) {
      setAuthTokens(null, null);
      localStorage.removeItem('user');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          onSuccess: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          },
          onFailed: (err: any) => {
            reject(err);
          },
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = currentRefreshToken ?? localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, user must login again
        setAuthTokens(null, null);
        localStorage.removeItem('user');
        processQueue(new Error('No refresh token'), null);
        return Promise.reject(error);
      }

      // Attempt to refresh the token
      const response = await axios.post(`${API_BASE_URL}/user/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens in storage
      setAuthTokens(accessToken, newRefreshToken);

      // Update authorization header for the failed request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests with new token
      processQueue(null, accessToken);

      // Retry original request with new token
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear tokens and redirect to login
      setAuthTokens(null, null);
      localStorage.removeItem('user');
      
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;

