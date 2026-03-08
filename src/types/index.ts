export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type TransferStatus = 'pending' | 'in_transit' | 'delivered' | 'rejected';
export type ShipmentStatus = 'expected' | 'accepted' | 'partial' | 'rejected';

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
