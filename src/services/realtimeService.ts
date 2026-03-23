import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/useDataStore';
import * as transferService from './transferService';
import * as orderService from './orderService';
import * as shipmentService from './shipmentService';
import * as productService from './productService';

let orderSub: any = null;
let transferSub: any = null;
let shipmentSub: any = null;
let productSub: any = null;

export const subscribeToRealtimeChanges = (branchId: string | undefined) => {
    if (!branchId) return;

    // Önceki abonelikleri temizle
    unsubscribeRealtimeChanges();

    // 1. Siparişler — payload.new ile direkt güncelle, tüm listeyi yeniden çekme
    orderSub = supabase
        .channel('public:orders')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
            async (payload) => {
                const event = payload.eventType;
                const newRec = payload.new as any;
                console.log('[Realtime] Order change:', event, newRec?.id);
                // Payload ile direkt store güncelle (eğer varsa), yoksa tam çek
                if ((event === 'UPDATE' || event === 'INSERT') && newRec?.id) {
                    // Siparişi store'da direkt güncelle
                    useDataStore.setState(s => ({
                        orders: event === 'INSERT'
                            ? [mapOrder(newRec), ...s.orders]
                            : s.orders.map(o => o.id === newRec.id ? { ...o, status: newRec.status } : o)
                    }));
                } else if (event === 'DELETE') {
                    const oldId = (payload.old as any)?.id;
                    if (oldId) useDataStore.setState(s => ({ orders: s.orders.filter(o => o.id !== oldId) }));
                } else {
                    useDataStore.getState().loadOrders();
                }
            }
        )
        .subscribe();

    // 2. Transferler — payload.new ile direkt güncelle (loadTransfers ÇAĞIRMA!)
    transferSub = supabase
        .channel('public:transfers')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transfers', filter: `branch_id=eq.${branchId}` },
            async (payload) => {
                const event = payload.eventType;
                const newRec = payload.new as any;
                console.log('[Realtime] Transfer change:', event, newRec?.id, 'status:', newRec?.status);

                if ((event === 'UPDATE' || event === 'INSERT') && newRec?.id) {
                    useDataStore.setState(s => ({
                        transfers: event === 'INSERT'
                            ? [mapTransfer(newRec), ...s.transfers]
                            : s.transfers.map(t =>
                                t.id === newRec.id
                                    ? { ...t, status: newRec.status }
                                    : t
                            )
                    }));
                } else if (event === 'DELETE') {
                    const oldId = (payload.old as any)?.id;
                    if (oldId) useDataStore.setState(s => ({ transfers: s.transfers.filter(t => t.id !== oldId) }));
                }
                // UPDATE event'te loadTransfers() ÇAĞIRMA — bu geri çekiyor!
            }
        )
        .subscribe();

    // 3. Sevkiyatlar
    shipmentSub = supabase
        .channel('public:shipments')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'shipments', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                const event = payload.eventType;
                const newRec = payload.new as any;
                console.log('[Realtime] Shipment change:', event, newRec?.id);
                if ((event === 'UPDATE' || event === 'INSERT') && newRec?.id) {
                    useDataStore.setState(s => ({
                        shipments: event === 'INSERT'
                            ? [mapShipment(newRec), ...s.shipments]
                            : s.shipments.map(sh =>
                                sh.id === newRec.id
                                    ? { ...sh, status: newRec.status }
                                    : sh
                            )
                    }));
                } else if (event === 'DELETE') {
                    const oldId = (payload.old as any)?.id;
                    if (oldId) useDataStore.setState(s => ({ shipments: s.shipments.filter(sh => sh.id !== oldId) }));
                }
            }
        )
        .subscribe();

    // 4. Ürünler — stok değişince tam çek (stok senkronizasyonu kritik)
    productSub = supabase
        .channel('public:products')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products', filter: `branch_id=eq.${branchId}` },
            () => {
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

// ── Minimal mapper'lar (realtime payload'dan) ────────────────
function mapTransfer(r: any) {
    return {
        id: r.id,
        transferNo: r.transfer_no,
        sourceWarehouse: r.source_warehouse,
        targetWarehouse: r.target_warehouse,
        status: r.status,
        plannedDate: r.planned_date,
        notes: r.notes ?? undefined,
        items: [], // Realtime payload'da items yok, mevcut items korunuyor
    };
}

function mapOrder(r: any) {
    return {
        id: r.id,
        orderNo: r.order_no,
        customer: r.customer,
        address: r.address ?? undefined,
        status: r.status,
        date: r.date,
        notes: r.notes ?? undefined,
        platformSource: r.platform_source ?? 'manual',
        platformOrderNo: r.platform_order_no ?? undefined,
        cargoCompany: r.cargo_company ?? undefined,
        cargoTrackingNo: r.cargo_tracking_no ?? undefined,
        items: [],
    };
}

function mapShipment(r: any) {
    return {
        id: r.id,
        shipmentNo: r.shipment_no,
        supplier: r.supplier,
        status: r.status,
        expectedDate: r.expected_date,
        plate: r.plate ?? undefined,
        driver: r.driver ?? undefined,
        notes: r.notes ?? undefined,
        items: [],
    };
}
