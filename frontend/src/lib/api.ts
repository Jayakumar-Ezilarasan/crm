import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 30000,
});

// Token management
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling and retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Only redirect to login if this is not a login request itself
      const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    // Retry logic (simple, for network errors)
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      // Retry once
      const config = error.config as AxiosRequestConfig & { _retry?: boolean };
      if (!config._retry) {
        config._retry = true;
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 