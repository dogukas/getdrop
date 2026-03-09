// ─── Supabase Database Tip Tanımları ──────────────────────────────────────────
// Bu dosya Supabase tablolarıyla eşleşen TypeScript tiplerini tanımlar.

export type UserRole = 'admin' | 'operator' | 'viewer';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type TransferStatus = 'pending' | 'in_transit' | 'delivered' | 'rejected';
export type ShipmentStatus = 'expected' | 'accepted' | 'partial' | 'rejected';
export type LogLevel = 'success' | 'warning' | 'error' | 'info';
export type LogModule = 'OMS' | 'Transfer' | 'Sevkiyat' | 'Stok' | 'Sistem';

// ─── Row Types (Supabase tablo satırları) ─────────────────────────────────────

export interface BranchRow {
    id: string;
    name: string;
    created_at: string;
}

export interface ProfileRow {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    branch_id: string | null;
    created_at: string;
}

export interface ProductRow {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unit: string;
    min_stock: number;
    branch_id: string | null;
    created_at: string;
}

export interface OrderRow {
    id: string;
    order_no: string;
    customer: string;
    address: string | null;
    status: OrderStatus;
    date: string;
    notes: string | null;
    branch_id: string | null;
    created_by: string | null;
    created_at: string;
}

export interface OrderItemRow {
    id: string;
    order_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
}

export interface TransferRow {
    id: string;
    transfer_no: string;
    source_warehouse: string;
    target_warehouse: string;
    status: TransferStatus;
    planned_date: string;
    notes: string | null;
    branch_id: string | null;
    created_by: string | null;
    created_at: string;
}

export interface TransferItemRow {
    id: string;
    transfer_id: string;
    product_name: string;
    sku: string;
    quantity: number;
}

export interface ShipmentRow {
    id: string;
    shipment_no: string;
    supplier: string;
    plate: string | null;
    driver: string | null;
    status: ShipmentStatus;
    expected_date: string;
    notes: string | null;
    branch_id: string | null;
    created_by: string | null;
    created_at: string;
}

export interface ShipmentItemRow {
    id: string;
    shipment_id: string;
    product_name: string;
    sku: string;
    expected_qty: number;
    accepted_qty: number | null;
}

export interface ActivityLogRow {
    id: string;
    level: LogLevel;
    title: string;
    description: string;
    module: LogModule;
    entity_id: string | null;
    entity_no: string | null;
    user_name: string | null;
    branch_id: string | null;
    created_at: string;
}

// ─── App-Level Types (store'da kullanılan) ───────────────────────────────────

export interface Branch {
    id: string;
    name: string;
}

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    branchId: string | null;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unit: string;
    minStock: number;
}

export interface OrderItem {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
}

export interface Order {
    id: string;
    orderNo: string;
    customer: string;
    address: string;
    status: OrderStatus;
    date: string;
    items: OrderItem[];
    notes?: string;
}

export interface TransferItem {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
}

export interface Transfer {
    id: string;
    transferNo: string;
    sourceWarehouse: string;
    targetWarehouse: string;
    status: TransferStatus;
    plannedDate: string;
    items: TransferItem[];
    notes?: string;
}

export interface ShipmentItem {
    id: string;
    productName: string;
    sku: string;
    expectedQty: number;
    acceptedQty?: number;
}

export interface Shipment {
    id: string;
    shipmentNo: string;
    supplier: string;
    plate: string;
    driver: string;
    status: ShipmentStatus;
    expectedDate: string;
    items: ShipmentItem[];
    notes?: string;
}

export interface ActivityLog {
    id: string;
    timestamp: Date;
    level: LogLevel;
    title: string;
    description: string;
    module: LogModule;
    entityId?: string;
    entityNo?: string;
    user?: string;
}

// ─── Supabase Database generic type ─────────────────────────────────────────
export type Database = {
    public: {
        Tables: {
            branches: { Row: BranchRow; Insert: Omit<BranchRow, 'id' | 'created_at'>; Update: Partial<BranchRow> };
            profiles: { Row: ProfileRow; Insert: Omit<ProfileRow, 'created_at'>; Update: Partial<ProfileRow> };
            products: { Row: ProductRow; Insert: Omit<ProductRow, 'id' | 'created_at'>; Update: Partial<ProductRow> };
            orders: { Row: OrderRow; Insert: Omit<OrderRow, 'id' | 'created_at'>; Update: Partial<OrderRow> };
            order_items: { Row: OrderItemRow; Insert: Omit<OrderItemRow, 'id'>; Update: Partial<OrderItemRow> };
            transfers: { Row: TransferRow; Insert: Omit<TransferRow, 'id' | 'created_at'>; Update: Partial<TransferRow> };
            transfer_items: { Row: TransferItemRow; Insert: Omit<TransferItemRow, 'id'>; Update: Partial<TransferItemRow> };
            shipments: { Row: ShipmentRow; Insert: Omit<ShipmentRow, 'id' | 'created_at'>; Update: Partial<ShipmentRow> };
            shipment_items: { Row: ShipmentItemRow; Insert: Omit<ShipmentItemRow, 'id'>; Update: Partial<ShipmentItemRow> };
            activity_logs: { Row: ActivityLogRow; Insert: Omit<ActivityLogRow, 'id' | 'created_at'>; Update: Partial<ActivityLogRow> };
        };
    };
};
