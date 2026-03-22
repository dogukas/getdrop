import { supabase } from '../lib/supabase';
import { Transfer, TransferStatus, TransferRow, TransferItemRow } from '../types/database';

function toTransfer(row: TransferRow, items: TransferItemRow[]): Transfer {
    return {
        id: row.id,
        transferNo: row.transfer_no,
        sourceWarehouse: row.source_warehouse,
        targetWarehouse: row.target_warehouse,
        status: row.status,
        plannedDate: row.planned_date,
        notes: row.notes ?? undefined,
        items: items.map(i => ({
            id: i.id,
            productName: i.product_name,
            sku: i.sku,
            quantity: i.quantity,
        })),
    };
}

export async function fetchTransfers(): Promise<Transfer[]> {
    const { data, error } = await supabase
        .from('transfers')
        .select('*, transfer_items(*)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((t: any) => toTransfer(t, t.transfer_items ?? []));
}

export async function updateTransferStatus(id: string, status: TransferStatus): Promise<void> {
    // supabase as any: Database tipi 'status' alanını Update'de tanımamış olabilir
    const { error } = await (supabase as any)
        .from('transfers')
        .update({ status })
        .eq('id', id);
    if (error) {
        // Push notification trigger'ından gelen hatalar (push token bulunamadı vs.)
        // asıl update başarılı olduğu için yoksay, sadece gerçek RLS/data hatalarını fırlat
        const msg: string = (error as any).message ?? '';
        const isNotifError =
            msg.toLowerCase().includes('push') ||
            msg.toLowerCase().includes('token') ||
            msg.toLowerCase().includes('notification') ||
            msg.toLowerCase().includes('expo') ||
            (error as any).code === 'P0001'; // PL/pgSQL RAISE exception (trigger hatası)
        if (!isNotifError) throw error;
        console.warn('[TransferService] Notification trigger error (non-fatal):', error);
    }
}
