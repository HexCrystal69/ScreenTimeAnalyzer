import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('attentrack_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('attentrack_token');
            localStorage.removeItem('attentrack_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
