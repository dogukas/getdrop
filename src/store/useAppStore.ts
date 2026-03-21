import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Branch, AppUser } from '../types/database';

export type { AppUser as UserType };

export type UserRole = 'admin' | 'operator' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Sistem Yöneticisi',
    operator: 'Depo Sorumlusu',
    viewer: 'Görüntüleyici',
};

interface AppState {
    isDarkMode: boolean;
    followSystem: boolean;        // Cihaz temasını otomatik takip et
    user: AppUser | null;
    branches: Branch[];
    activeBranch: Branch | null;
    unreadCount: number;
    toggleTheme: () => void;
    setDarkMode: (v: boolean) => void;
    setFollowSystem: (v: boolean) => void;
    setUser: (user: AppUser | null) => void;
    setBranches: (branches: Branch[]) => void;
    setActiveBranch: (branch: Branch) => void;
    setUnreadCount: (n: number) => void;
    decrementUnread: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            followSystem: true,        // Varsayılan: sistemi takip et
            user: null,
            branches: [],
            activeBranch: null,
            unreadCount: 0,
            toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode, followSystem: false })),
            setDarkMode: (v) => set({ isDarkMode: v, followSystem: false }),
            setFollowSystem: (v) => {
                // Sistemi takip etmek açıldığında mevcut sistem temasını da yaz
                const scheme = Appearance.getColorScheme();
                set({ followSystem: v, isDarkMode: v ? scheme === 'dark' : undefined as any });
            },
            setUser: (user) => set({ user }),
            setBranches: (branches) => set({ branches }),
            setActiveBranch: (branch) => set({ activeBranch: branch }),
            setUnreadCount: (n) => set({ unreadCount: n }),
            decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
        }),
        {
            name: 'getdrop-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isDarkMode: state.isDarkMode,
                followSystem: state.followSystem,
                user: state.user,
                activeBranch: state.activeBranch,
            }),
        }
    )
);
