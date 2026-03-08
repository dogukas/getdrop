import { create } from 'zustand';

export type UserRole = 'admin' | 'operator' | 'viewer';

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Sistem Yöneticisi',
    operator: 'Depo Sorumlusu',
    viewer: 'Görüntüleyici',
};
export { ROLE_LABELS };

export type Branch = { id: string; name: string };

interface AppState {
    isDarkMode: boolean;
    user: { name: string; email: string; role: UserRole } | null;
    branches: Branch[];
    activeBranch: Branch | null;
    unreadCount: number;
    toggleTheme: () => void;
    setUser: (user: { name: string; email: string; role: UserRole } | null) => void;
    setUnreadCount: (n: number) => void;
    decrementUnread: () => void;
    setActiveBranch: (branch: Branch) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isDarkMode: false,
    unreadCount: 5,
    user: null,
    branches: [
        { id: 'b1', name: 'Merkez Depo' },
        { id: 'b2', name: 'Antalya Dağıtım' },
        { id: 'b3', name: 'Bursa Transfer' },
    ],
    activeBranch: { id: 'b1', name: 'Merkez Depo' },
    toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    setUser: (user) => set({ user }),
    setUnreadCount: (n) => set({ unreadCount: n }),
    decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    setActiveBranch: (branch) => set({ activeBranch: branch }),
}));
