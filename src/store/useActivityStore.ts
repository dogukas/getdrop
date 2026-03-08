import { create } from 'zustand';

// ─── Log Kaydı Tipi ─────────────────────────────────────────────────────────
export type LogLevel = 'success' | 'warning' | 'error' | 'info';

export interface ActivityLog {
    id: string;
    timestamp: Date;
    level: LogLevel;
    title: string;
    description: string;
    module: 'OMS' | 'Transfer' | 'Sevkiyat' | 'Stok' | 'Sistem';
    entityId?: string;
    entityNo?: string;
    user?: string;
}

// ─── Store ─────────────────────────────────────────────────────────────────
interface ActivityState {
    logs: ActivityLog[];
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
}

let logIdCounter = 100;

// Başlangıç verisi — Sisteme hoş geldiniz mesajları
const INITIAL_LOGS: ActivityLog[] = [
    {
        id: 'init-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        level: 'info',
        title: 'Sistem Başlatıldı',
        description: 'DepoSaaS v1.0.0 aktif. Tüm modüller hazır.',
        module: 'Sistem',
    },
    {
        id: 'init-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        level: 'warning',
        title: 'Kritik Stok Uyarısı',
        description: 'Fırın X500 stoğu minimum seviyenin altına düştü (5 adet).',
        module: 'Stok',
        entityId: 'p3',
    },
    {
        id: 'init-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        level: 'info',
        title: 'Sevkiyat Bekleniyor',
        description: 'SHP-2024-001 — Arçelik Tedarik tarafından kamyon yola çıktı.',
        module: 'Sevkiyat',
        entityNo: 'SHP-2024-001',
    },
    {
        id: 'init-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        level: 'warning',
        title: 'Transfer Bekliyor',
        description: 'TRF-2024-001 Ankara\'ya yönelik transfer henüz onaylanmadı.',
        module: 'Transfer',
        entityNo: 'TRF-2024-001',
    },
];

export const useActivityStore = create<ActivityState>((set) => ({
    logs: INITIAL_LOGS,

    addLog: (log) => set(state => {
        const newLog: ActivityLog = {
            ...log,
            id: `log-${++logIdCounter}`,
            timestamp: new Date(),
        };
        return { logs: [newLog, ...state.logs].slice(0, 100) }; // max 100 kayıt
    }),

    clearLogs: () => set({ logs: [] }),
}));
