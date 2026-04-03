const defaultApiBase = 'http://localhost:5000/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBase;

export const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';
