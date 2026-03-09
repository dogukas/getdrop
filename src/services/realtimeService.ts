import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/useDataStore';

let orderSub: any = null;
let transferSub: any = null;
let shipmentSub: any = null;
let productSub: any = null;

export const subscribeToRealtimeChanges = (branchId: string | undefined) => {
    if (!branchId) return;

    // Önceki abonelikleri temizle
    unsubscribeRealtimeChanges();

    // 1. Siparişler (orders)
    orderSub = supabase
        .channel('public:orders')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                const newRec = payload.new as any;
                console.log('[Realtime] Order change:', payload.eventType, newRec?.id);
                // Basit bir yaklaşım, tüm listeyi yeniden çektirir 
                useDataStore.getState().loadOrders();
            }
        )
        .subscribe();

    // 2. Transferler (transfers)
    transferSub = supabase
        .channel('public:transfers')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transfers', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                const newRec = payload.new as any;
                console.log('[Realtime] Transfer change:', payload.eventType, newRec?.id);
                useDataStore.getState().loadTransfers();
            }
        )
        .subscribe();

    // 3. Sevkiyatlar (shipments)
    shipmentSub = supabase
        .channel('public:shipments')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'shipments', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                const newRec = payload.new as any;
                console.log('[Realtime] Shipment change:', payload.eventType, newRec?.id);
                useDataStore.getState().loadShipments();
            }
        )
        .subscribe();

    // 4. Ürünler (products)
    productSub = supabase
        .channel('public:products')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                const newRec = payload.new as any;
                console.log('[Realtime] Product change:', payload.eventType, newRec?.id);
                useDataStore.getState().loadProducts();
            }
        )
        .subscribe();

    console.log(`[Realtime] Subscribed to changes for branch: ${branchId}`);
};

export const unsubscribeRealtimeChanges = () => {
    if (orderSub) { supabase.removeChannel(orderSub); orderSub = null; }
    if (transferSub) { supabase.removeChannel(transferSub); transferSub = null; }
    if (shipmentSub) { supabase.removeChannel(shipmentSub); shipmentSub = null; }
    if (productSub) { supabase.removeChannel(productSub); productSub = null; }
    console.log('[Realtime] Unsubscribed from all changes.');
};
