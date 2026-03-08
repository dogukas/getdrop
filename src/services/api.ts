import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

// Gerçek hayatta bu .env'den gelir (örn. process.env.EXPO_PUBLIC_API_URL)
const API_URL = 'https://api.deposaas.com/v1';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Her isteğe Authorization Header (Token) ekliyoruz
api.interceptors.request.use(
    (config) => {
        // Gerçek senaryoda bu AsyncStorage'den veya SecureStore'dan okunur
        const token = 'mock-jwt-token-73821';
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: 401 ve 403 Hata Yönetimi
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                // Token süresi dolmuş veya geçersiz. 
                console.log('[API] 401 Unauthorized - Kulllanıcıyı dışarı at');
                // useAppStore.getState().setUser(null); // Oturumu sonlandır
            } else if (status === 403) {
                // Yetki hatası
                console.log('[API] 403 Forbidden - Bu işlemi yapmaya yetkiniz yok');
            }
        } else {
            // Ağ hatası veya sunucuya erişilemiyor
            console.log('[API] Network Error veya Timeout');
        }
        return Promise.reject(error);
    }
);
