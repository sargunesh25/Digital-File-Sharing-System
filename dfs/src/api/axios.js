import axios from 'axios';
import { getBackendBaseUrl } from './backendUrl';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    async (config) => {
        const backendBaseUrl = await getBackendBaseUrl();
        config.baseURL = `${backendBaseUrl}/api`;

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
