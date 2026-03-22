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
    const { error } = await (supabase as any)
        .from('transfers')
        .update({ status })
        .eq('id', id);

    if (error) {
        // Tüm hataları logla ve fırlat — hiçbir hatayı gizleme
        console.error('[TransferService] updateTransferStatus error:', JSON.stringify(error));
        throw new Error(error.message || error.error_description || `Supabase error code: ${error.code}`);
    }
}

/**
 * Transfer'in güncel durumunu Supabase'den tek seferlik çek.
 * Update sonrası doğrulama için kullanılır.
 */
export async function fetchSingleTransfer(id: string): Promise<Transfer | null> {
    const { data, error } = await supabase
        .from('transfers')
        .select('*, transfer_items(*)')
        .eq('id', id)
        .single();
    if (error || !data) return null;
    return toTransfer(data as any, (data as any).transfer_items ?? []);
}
