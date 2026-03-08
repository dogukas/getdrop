import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

// Kullanıcı bilgilerini store'da tutuyoruz. AuthContext ise oturum durumunu (Token vb.) yönetecek.
interface AuthContextData {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, setUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);

    // Uygulama açılışında lokalden token veya user bilgisi var mı diye bakılıyormuş gibi simüle ediyoruz
    useEffect(() => {
        // Gerçekte: AsyncStorage.getItem('token') olurdu.
        const bootstrapAsync = async () => {
            setTimeout(() => setIsLoading(false), 800);
        };
        bootstrapAsync();
    }, []);

    const login = async (email: string, pass: string): Promise<void> => {
        // API mock simulasyonu
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                if (email === 'admin@depo.com' && pass === '1234') {
                    setUser({ name: 'Ahmet Yılmaz', email, role: 'admin' });
                    resolve();
                } else if (email === 'op@depo.com' && pass === '1234') {
                    setUser({ name: 'Mehmet Sorumlu', email, role: 'operator' });
                    resolve();
                } else if (email === 'misafir@depo.com' && pass === '1234') {
                    setUser({ name: 'Ayşe Gözlemci', email, role: 'viewer' });
                    resolve();
                } else {
                    reject('E-posta veya şifre hatalı');
                }
            }, 1000); // 1sn gecikme ile ağ isteği hissi
        });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
