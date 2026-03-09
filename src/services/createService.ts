import { supabase } from '../lib/supabase';

// ─── Sipariş Oluştur ─────────────────────────────────────────────────────────
export async function createOrder(data: {
    customer: string;
    address: string;
    notes?: string;
    branchId: string;
    createdBy: string;
    items: { productName: string; sku: string; quantity: number; unitPrice: number }[];
}): Promise<string> {
    const orderNo = `ORD-${Date.now()}`;
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            order_no: orderNo,
            customer: data.customer,
            address: data.address,
            notes: data.notes ?? null,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            branch_id: data.branchId,
            created_by: data.createdBy,
        })
        .select('id')
        .single();
    if (error) throw error;

    const itemRows = data.items.map(i => ({
        order_id: order.id,
        product_name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: i.unitPrice,
    }));
    const { error: itemErr } = await supabase.from('order_items').insert(itemRows);
    if (itemErr) throw itemErr;

    return order.id;
}

// ─── Transfer Oluştur ────────────────────────────────────────────────────────
export async function createTransfer(data: {
    sourceWarehouse: string;
    targetWarehouse: string;
    plannedDate: string;
    notes?: string;
    branchId: string;
    createdBy: string;
    items: { productName: string; sku: string; quantity: number }[];
}): Promise<string> {
    const transferNo = `TRF-${Date.now()}`;
    const { data: transfer, error } = await supabase
        .from('transfers')
        .insert({
            transfer_no: transferNo,
            source_warehouse: data.sourceWarehouse,
            target_warehouse: data.targetWarehouse,
            planned_date: data.plannedDate,
            notes: data.notes ?? null,
            status: 'pending',
            branch_id: data.branchId,
            created_by: data.createdBy,
        })
        .select('id')
        .single();
    if (error) throw error;

    const { error: itemErr } = await supabase.from('transfer_items').insert(
        data.items.map(i => ({ transfer_id: transfer.id, product_name: i.productName, sku: i.sku, quantity: i.quantity }))
    );
    if (itemErr) throw itemErr;
    return transfer.id;
}

// ─── Sevkiyat Oluştur ────────────────────────────────────────────────────────
export async function createShipment(data: {
    supplier: string;
    plate: string;
    driver: string;
    expectedDate: string;
    notes?: string;
    branchId: string;
    createdBy: string;
    items: { productName: string; sku: string; expectedQty: number }[];
}): Promise<string> {
    const shipmentNo = `SHP-${Date.now()}`;
    const { data: shipment, error } = await supabase
        .from('shipments')
        .insert({
            shipment_no: shipmentNo,
            supplier: data.supplier,
            plate: data.plate,
            driver: data.driver,
            expected_date: data.expectedDate,
            notes: data.notes ?? null,
            status: 'expected',
            branch_id: data.branchId,
            created_by: data.createdBy,
        })
        .select('id')
        .single();
    if (error) throw error;

    const { error: itemErr } = await supabase.from('shipment_items').insert(
        data.items.map(i => ({ shipment_id: shipment.id, product_name: i.productName, sku: i.sku, expected_qty: i.expectedQty }))
    );
    if (itemErr) throw itemErr;
    return shipment.id;
}

// ─── Ürün Oluştur ────────────────────────────────────────────────────────────
export async function createProduct(data: {
    name: string; sku: string; stock: number; unit: string; minStock: number; branchId: string;
}): Promise<void> {
    const { error } = await supabase.from('products').insert({
        name: data.name, sku: data.sku, stock: data.stock,
        unit: data.unit, min_stock: data.minStock, branch_id: data.branchId,
    });
    if (error) throw error;
}
