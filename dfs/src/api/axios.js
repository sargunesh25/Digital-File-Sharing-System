import axios from 'axios';

const API_HOST = window.location.hostname; // Dynamically use the current host
let baseURL = import.meta.env.VITE_BACKEND_URL || `http://${API_HOST}:5000`;
// Strip trailing slash if present
baseURL = baseURL.replace(/\/$/, '');

const api = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // If data is FormData, let the browser set the Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
