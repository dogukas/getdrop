import { create } from 'zustand';
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
    user: AppUser | null;
    branches: Branch[];
    activeBranch: Branch | null;
    unreadCount: number;
    toggleTheme: () => void;
    setUser: (user: AppUser | null) => void;
    setBranches: (branches: Branch[]) => void;
    setActiveBranch: (branch: Branch) => void;
    setUnreadCount: (n: number) => void;
    decrementUnread: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    isDarkMode: false,
    user: null,
    branches: [],
    activeBranch: null,
    unreadCount: 0,
    toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
    setUser: (user) => set({ user }),
    setBranches: (branches) => set({ branches }),
    setActiveBranch: (branch) => set({ activeBranch: branch }),
    setUnreadCount: (n) => set({ unreadCount: n }),
    decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}));
