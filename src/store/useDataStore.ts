import { create } from 'zustand';
import { Order, Transfer, Shipment, Product, OrderStatus, TransferStatus } from '../types/database';
import * as orderService from '../services/orderService';
import * as transferService from '../services/transferService';
import * as shipmentService from '../services/shipmentService';
import * as productService from '../services/productService';

interface DataState {
    orders: Order[];
    transfers: Transfer[];
    shipments: Shipment[];
    products: Product[];
    isLoading: boolean;
    error: string | null;

    // ── Yükleme ──
    loadAll: () => Promise<void>;
    loadOrders: () => Promise<void>;
    loadTransfers: () => Promise<void>;
    loadShipments: () => Promise<void>;
    loadProducts: () => Promise<void>;

    // ── Sipariş Aksiyonları ──
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    completeOrder: (id: string) => Promise<void>;

    // ── Transfer Aksiyonları ──
    updateTransferStatus: (id: string, status: TransferStatus) => Promise<void>;

    // ── Sevkiyat Aksiyonları ──
    acceptShipment: (id: string) => Promise<void>;
    rejectShipment: (id: string) => Promise<void>;
    partialAcceptShipment: (id: string, items: { sku: string; qty: number }[]) => Promise<void>;

    // ── Stok Aksiyonları ──
    adjustStock: (sku: string, delta: number) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
    orders: [],
    transfers: [],
    shipments: [],
    products: [],
    isLoading: false,
    error: null,

    // ── Yükleme ─────────────────────────────────────────────
    loadAll: async () => {
        set({ isLoading: true, error: null });
        try {
            const [orders, transfers, shipments, products] = await Promise.all([
                orderService.fetchOrders(),
                transferService.fetchTransfers(),
                shipmentService.fetchShipments(),
                productService.fetchProducts(),
            ]);
            set({ orders, transfers, shipments, products, isLoading: false });
        } catch (e: any) {
            set({ error: e.message ?? 'Veri yüklenemedi', isLoading: false });
        }
    },

    loadOrders: async () => {
        const orders = await orderService.fetchOrders();
        set({ orders });
    },

    loadTransfers: async () => {
        const transfers = await transferService.fetchTransfers();
        set({ transfers });
    },

    loadShipments: async () => {
        const shipments = await shipmentService.fetchShipments();
        set({ shipments });
    },

    loadProducts: async () => {
        const products = await productService.fetchProducts();
        set({ products });
    },

    // ── Sipariş Aksiyonları ─────────────────────────────────
    updateOrderStatus: async (id, status) => {
        // Optimistic: önce UI'ı güncelle
        set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status } : o) }));
        await orderService.updateOrderStatus(id, status);
    },

    completeOrder: async (id) => {
        set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: 'completed' } : o) }));
        await orderService.completeOrder(id);
        // Güncel stok bilgisini çek
        await get().loadProducts();
    },

    // ── Transfer Aksiyonları ────────────────────────────────
    updateTransferStatus: async (id, status) => {
        // 1. Optimistic: UI'yı hemen güncelle
        set(s => ({ transfers: s.transfers.map(t => t.id === id ? { ...t, status } : t) }));
        // 2. Supabase'e kaydet (hata fırlatırsa üstteki catch yakalar)
        await transferService.updateTransferStatus(id, status);
        // 3. Kaydedilen gerçek durumu doğrula (trigger geri çekmiş olabilir)
        const saved = await transferService.fetchSingleTransfer(id);
        if (saved) {
            set(s => ({ transfers: s.transfers.map(t => t.id === id ? { ...t, status: saved.status } : t) }));
            if (saved.status !== status) {
                throw new Error(`Supabase status mismatch: expected "${status}", got "${saved.status}". Trigger may have rejected the update.`);
            }
        }
    },

    // ── Sevkiyat Aksiyonları ────────────────────────────────
    acceptShipment: async (id) => {
        set(s => ({ shipments: s.shipments.map(sh => sh.id === id ? { ...sh, status: 'accepted' } : sh) }));
        await shipmentService.acceptShipment(id);
        await get().loadProducts();
    },

    rejectShipment: async (id) => {
        set(s => ({ shipments: s.shipments.map(sh => sh.id === id ? { ...sh, status: 'rejected' } : sh) }));
        await shipmentService.rejectShipment(id);
    },

    partialAcceptShipment: async (id, items) => {
        set(s => ({ shipments: s.shipments.map(sh => sh.id === id ? { ...sh, status: 'partial' } : sh) }));
        await shipmentService.partialAcceptShipment(id, items);
        await get().loadProducts();
    },

    // ── Stok Aksiyonları ────────────────────────────────────
    adjustStock: async (sku, delta) => {
        await productService.adjustStock(sku, delta);
        await get().loadProducts();
    },
}));
