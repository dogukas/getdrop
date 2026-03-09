import { supabase } from '../lib/supabase';
import { ActivityLog, ActivityLogRow, LogLevel, LogModule } from '../types/database';

function toActivityLog(row: ActivityLogRow): ActivityLog {
    return {
        id: row.id,
        timestamp: new Date(row.created_at),
        level: row.level,
        title: row.title,
        description: row.description,
        module: row.module,
        entityId: row.entity_id ?? undefined,
        entityNo: row.entity_no ?? undefined,
        user: row.user_name ?? undefined,
    };
}

export async function fetchActivityLogs(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toActivityLog);
}

export async function insertActivityLog(log: {
    level: LogLevel;
    title: string;
    description: string;
    module: LogModule;
    entityId?: string;
    entityNo?: string;
    user?: string;
    branchId?: string;
}): Promise<void> {
    const { error } = await supabase.from('activity_logs').insert({
        level: log.level,
        title: log.title,
        description: log.description,
        module: log.module,
        entity_id: log.entityId ?? null,
        entity_no: log.entityNo ?? null,
        user_name: log.user ?? null,
        branch_id: log.branchId ?? null,
    });
    if (error) console.error('[ActivityLog] insert error:', error);
}
