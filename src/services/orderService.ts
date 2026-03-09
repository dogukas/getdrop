import { supabase } from '../lib/supabase';
import { Order, OrderItem, OrderStatus, OrderRow, OrderItemRow } from '../types/database';

// DB satırı → App modeli dönüşümü
function toOrderItem(row: OrderItemRow): OrderItem {
    return {
        id: row.id,
        productName: row.product_name,
        sku: row.sku,
        quantity: row.quantity,
        unitPrice: row.unit_price,
    };
}

function toOrder(row: OrderRow, items: OrderItemRow[]): Order {
    return {
        id: row.id,
        orderNo: row.order_no,
        customer: row.customer,
        address: row.address ?? '',
        status: row.status,
        date: row.date,
        notes: row.notes ?? undefined,
        items: items.map(toOrderItem),
    };
}

export async function fetchOrders(): Promise<Order[]> {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (orders ?? []).map((o: any) => toOrder(o, o.order_items ?? []));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}

export async function completeOrder(id: string): Promise<void> {
    // 1. Siparişi tamamlandı yap
    await updateOrderStatus(id, 'completed');

    // 2. Sipariş kalemlerini çek ve stoktan düş
    const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
    if (error) throw error;

    for (const item of items ?? []) {
        const { data: product } = await supabase
            .from('products')
            .select('id, stock')
            .eq('sku', item.sku)
            .single();
        if (product) {
            await supabase
                .from('products')
                .update({ stock: Math.max(0, product.stock - item.quantity) })
                .eq('id', product.id);
        }
    }
}
