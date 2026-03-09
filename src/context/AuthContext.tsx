import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { useActivityStore } from '../store/useActivityStore';
import { fetchBranches } from '../services/branchService';

interface AuthContextData {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const setUser = useAppStore(s => s.setUser);
    const setBranches = useAppStore(s => s.setBranches);
    const setActiveBranch = useAppStore(s => s.setActiveBranch);
    const user = useAppStore(s => s.user);
    const [isLoading, setIsLoading] = useState(true);

    // Uygulama açılışında mevcut oturumu kontrol et
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Auth durum değişikliklerini dinle
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    await loadUserProfile(session.user.id);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Profil + branch yükle
    const loadUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !profile) {
                console.error('[Auth] Profil bulunamadı:', error);
                setIsLoading(false);
                return;
            }

            setUser({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                branchId: profile.branch_id,
            });

            // Branch'leri yükle
            const branches = await fetchBranches();
            setBranches(branches);
            const activeBranch = profile.branch_id
                ? branches.find(b => b.id === profile.branch_id) ?? (branches[0] || null)
                : (branches[0] || null);
            if (activeBranch) setActiveBranch(activeBranch);

            // Veri yüklemeyi başlat
            await Promise.all([
                useDataStore.getState().loadAll(),
                useActivityStore.getState().loadLogs(),
            ]);
        } catch (e) {
            console.error('[Auth] loadUserProfile error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string): Promise<void> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error.message;
    };

    const logout = async (): Promise<void> => {
        await supabase.auth.signOut();
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
