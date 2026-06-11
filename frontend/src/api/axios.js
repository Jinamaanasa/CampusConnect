import axios from 'axios';

const api = axios.create({
  // In development, normally handled by Vite proxy
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = axios.create({ baseURL: 'http://localhost:8085/api/auth' });
export const userApi = axios.create({ baseURL: 'http://localhost:8085/api/users' });
export const postApi = axios.create({ baseURL: 'http://localhost:8086/api/posts' });
export const requestApi = axios.create({ baseURL: 'http://localhost:8087/api/requests' });
export const notifApi = axios.create({ baseURL: 'http://localhost:8088/api/notifications' });

[userApi, postApi, requestApi, notifApi].forEach(instance => {
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
});

export default api;
