import { supabase } from '../lib/supabase';
import { Shipment, ShipmentStatus, ShipmentRow, ShipmentItemRow } from '../types/database';

function toShipment(row: ShipmentRow, items: ShipmentItemRow[]): Shipment {
    return {
        id: row.id,
        shipmentNo: row.shipment_no,
        supplier: row.supplier,
        plate: row.plate ?? '',
        driver: row.driver ?? '',
        status: row.status,
        expectedDate: row.expected_date,
        notes: row.notes ?? undefined,
        items: items.map(i => ({
            id: i.id,
            productName: i.product_name,
            sku: i.sku,
            expectedQty: i.expected_qty,
            acceptedQty: i.accepted_qty ?? undefined,
        })),
    };
}

export async function fetchShipments(): Promise<Shipment[]> {
    const { data, error } = await supabase
        .from('shipments')
        .select('*, shipment_items(*)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((s: any) => toShipment(s, s.shipment_items ?? []));
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus): Promise<void> {
    const { error } = await supabase
        .from('shipments')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}

export async function acceptShipment(id: string): Promise<void> {
    // 1. Sevkiyatı kabul et
    await updateShipmentStatus(id, 'accepted');

    // 2. Tüm kalemleri kabul miktarı = beklenen ile güncelle ve stok ekle
    const { data: items } = await supabase
        .from('shipment_items')
        .select('*')
        .eq('shipment_id', id);

    for (const item of items ?? []) {
        await supabase
            .from('shipment_items')
            .update({ accepted_qty: item.expected_qty })
            .eq('id', item.id);

        // Stok güncelle
        const { data: product } = await supabase
            .from('products')
            .select('id, stock')
            .eq('sku', item.sku)
            .single();
        if (product) {
            await supabase
                .from('products')
                .update({ stock: product.stock + item.expected_qty })
                .eq('id', product.id);
        }
    }
}

export async function rejectShipment(id: string): Promise<void> {
    await updateShipmentStatus(id, 'rejected');
}

export async function partialAcceptShipment(
    id: string,
    acceptedItems: { sku: string; qty: number }[]
): Promise<void> {
    await updateShipmentStatus(id, 'partial');

    for (const accepted of acceptedItems) {
        const { data: si } = await supabase
            .from('shipment_items')
            .select('id')
            .eq('shipment_id', id)
            .eq('sku', accepted.sku)
            .single();
        if (si) {
            await supabase
                .from('shipment_items')
                .update({ accepted_qty: accepted.qty })
                .eq('id', si.id);
        }

        const { data: product } = await supabase
            .from('products')
            .select('id, stock')
            .eq('sku', accepted.sku)
            .single();
        if (product) {
            await supabase
                .from('products')
                .update({ stock: product.stock + accepted.qty })
                .eq('id', product.id);
        }
    }
}
