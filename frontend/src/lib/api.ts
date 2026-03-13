import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    withCredentials: true,
    timeout: 15000, // 15 seconds timeout to prevent hanging builds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & 403
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined') {
            if (error.response?.status === 401) {
                console.warn('Session expired. Clearing stale tokens.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // We don't force redirect yet to allow user to save work if possible or just see the error
            }

            // Global Ban Interceptor
            if (error.response?.status === 403 && error.response?.data?.banned) {
                localStorage.setItem('banned_title', error.response.data.title || 'Access Denied');
                localStorage.setItem('banned_message', error.response.data.message || 'Your access has been permanently restricted.');

                // Instantly wipe tokens to prevent further unauthenticated requests
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (window.location.pathname !== '/banned') {
                    window.location.href = '/banned';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
