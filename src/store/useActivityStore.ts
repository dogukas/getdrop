import { create } from 'zustand';
import { ActivityLog, LogLevel, LogModule } from '../types/database';
import { insertActivityLog, fetchActivityLogs } from '../services/activityService';
import { useAppStore } from './useAppStore';

interface ActivityState {
    logs: ActivityLog[];
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'> & { branchId?: string }) => Promise<void>;
    loadLogs: () => Promise<void>;
    clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
    logs: [],

    loadLogs: async () => {
        try {
            const logs = await fetchActivityLogs(50);
            set({ logs });
        } catch (e) {
            console.error('[ActivityStore] loadLogs error:', e);
        }
    },

    addLog: async (log) => {
        const newLog: ActivityLog = {
            ...log,
            id: `local-${Date.now()}`,
            timestamp: new Date(),
        };

        // Optimistic update
        set(s => ({ logs: [newLog, ...s.logs].slice(0, 100) }));

        // Bildirim sayacı artır
        useAppStore.getState().setUnreadCount(
            useAppStore.getState().unreadCount + 1
        );

        // Supabase'e yaz
        await insertActivityLog({
            level: log.level,
            title: log.title,
            description: log.description,
            module: log.module,
            entityId: log.entityId,
            entityNo: log.entityNo,
            user: log.user,
            branchId: log.branchId,
        });
    },

    clearLogs: () => set({ logs: [] }),
}));
