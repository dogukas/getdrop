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
    const { error } = await supabase
        .from('transfers')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}
