import { Order, Transfer, Shipment } from '../types';

export interface Product { id: string; name: string; sku: string; stock: number; }

export const ORDERS: Order[] = [
    {
        id: '1', orderNo: 'ORD-2024-001', customer: 'Arçelik A.Ş.', status: 'pending',
        date: '2024-03-02', address: 'Organize Sanayi Bölgesi, Bursa',
        notes: 'İvedi kargo teslimatlı',
        items: [
            { id: 'i1', productName: 'Buzdolabı A320', sku: 'BZDLB-A320', quantity: 5, unitPrice: 8500 },
            { id: 'i2', productName: 'Çamaşır Makinesi C200', sku: 'CWM-C200', quantity: 3, unitPrice: 6200 },
        ],
    },
    {
        id: '2', orderNo: 'ORD-2024-002', customer: 'Bosch Türkiye', status: 'processing',
        date: '2024-03-01', address: 'Tuzla Lojistik Merkezi, İstanbul',
        items: [
            { id: 'i3', productName: 'Fırın X500', sku: 'FRN-X500', quantity: 10, unitPrice: 4300 },
            { id: 'i4', productName: 'Bulaşık Makinesi D100', sku: 'BWM-D100', quantity: 8, unitPrice: 5100 },
            { id: 'i5', productName: 'Mikro Fırın M80', sku: 'MFN-M80', quantity: 15, unitPrice: 1800 },
        ],
    },
    {
        id: '3', orderNo: 'ORD-2024-003', customer: 'Samsung Elektronik', status: 'completed',
        date: '2024-03-01', address: 'Esenyurt Depo, İstanbul',
        items: [
            { id: 'i6', productName: 'TV 65 inç', sku: 'TV-65-QN', quantity: 20, unitPrice: 22000 },
        ],
    },
    {
        id: '4', orderNo: 'ORD-2024-004', customer: 'Vestel A.Ş.', status: 'pending',
        date: '2024-03-02', address: 'Manisa Fabrika Çıkışı',
        notes: 'Hafta sonu teslim edilmemeli',
        items: [
            { id: 'i7', productName: 'Klima 18000 BTU', sku: 'KLM-18K', quantity: 12, unitPrice: 9500 },
            { id: 'i8', productName: 'Klima 24000 BTU', sku: 'KLM-24K', quantity: 6, unitPrice: 13500 },
        ],
    },
    {
        id: '5', orderNo: 'ORD-2024-005', customer: 'Philips Türkiye', status: 'cancelled',
        date: '2024-02-28', address: 'Ankara Dağıtım Merkezi',
        items: [
            { id: 'i9', productName: 'Süpürge Robot R300', sku: 'RBT-R300', quantity: 30, unitPrice: 4200 },
        ],
    },
    {
        id: '6', orderNo: 'ORD-2024-006', customer: 'Beko Global', status: 'processing',
        date: '2024-03-02', address: 'İzmir Liman Deposu',
        items: [
            { id: 'i10', productName: 'Derin Dondurucu F70', sku: 'FRZ-F70', quantity: 7, unitPrice: 7800 },
            { id: 'i11', productName: 'Buz Makinesi BM10', sku: 'ICM-BM10', quantity: 4, unitPrice: 3200 },
        ],
    },
    {
        id: '7', orderNo: 'ORD-2024-007', customer: 'LG Elektronik', status: 'pending',
        date: '2024-03-02', address: 'Gebze OSB, Kocaeli',
        items: [
            { id: 'i12', productName: 'OLED TV 55 inç', sku: 'TV-OLED55', quantity: 15, unitPrice: 35000 },
        ],
    },
    {
        id: '8', orderNo: 'ORD-2024-008', customer: 'Tefal Türkiye', status: 'completed',
        date: '2024-02-29', address: 'Çerkezköy Depo, Tekirdağ',
        items: [
            { id: 'i13', productName: 'Fritöz AF200', sku: 'AFR-AF200', quantity: 50, unitPrice: 1500 },
            { id: 'i14', productName: 'Blender BL100', sku: 'BLN-BL100', quantity: 40, unitPrice: 950 },
        ],
    },
];

export const TRANSFERS: Transfer[] = [
    {
        id: 't1', transferNo: 'TRF-2024-001',
        sourceWarehouse: 'İstanbul Ana Depo', targetWarehouse: 'Ankara Bölge Depo',
        status: 'pending', plannedDate: '2024-03-03',
        items: [
            { id: 'ti1', productName: 'Buzdolabı A320', sku: 'BZDLB-A320', quantity: 8 },
            { id: 'ti2', productName: 'TV 65 inç', sku: 'TV-65-QN', quantity: 5 },
        ],
    },
    {
        id: 't2', transferNo: 'TRF-2024-002',
        sourceWarehouse: 'Bursa Depo', targetWarehouse: 'İstanbul Ana Depo',
        status: 'in_transit', plannedDate: '2024-03-02',
        notes: 'Soğuk zincir ürün — dikkat',
        items: [
            { id: 'ti3', productName: 'Klima 18000 BTU', sku: 'KLM-18K', quantity: 10 },
        ],
    },
    {
        id: 't3', transferNo: 'TRF-2024-003',
        sourceWarehouse: 'İzmir Depo', targetWarehouse: 'İstanbul Ana Depo',
        status: 'delivered', plannedDate: '2024-03-01',
        items: [
            { id: 'ti4', productName: 'Çamaşır Makinesi C200', sku: 'CWM-C200', quantity: 15 },
            { id: 'ti5', productName: 'Bulaşık Makinesi D100', sku: 'BWM-D100', quantity: 10 },
        ],
    },
    {
        id: 't4', transferNo: 'TRF-2024-004',
        sourceWarehouse: 'Ankara Bölge Depo', targetWarehouse: 'Gaziantep Depo',
        status: 'pending', plannedDate: '2024-03-04',
        items: [
            { id: 'ti6', productName: 'Fırın X500', sku: 'FRN-X500', quantity: 6 },
        ],
    },
    {
        id: 't5', transferNo: 'TRF-2024-005',
        sourceWarehouse: 'İstanbul Ana Depo', targetWarehouse: 'İzmir Depo',
        status: 'rejected', plannedDate: '2024-03-01',
        notes: 'Kapasite yetersiz — iptal edildi',
        items: [
            { id: 'ti7', productName: 'Derin Dondurucu F70', sku: 'FRZ-F70', quantity: 12 },
        ],
    },
    {
        id: 't6', transferNo: 'TRF-2024-006',
        sourceWarehouse: 'Bursa Depo', targetWarehouse: 'İzmir Depo',
        status: 'in_transit', plannedDate: '2024-03-02',
        items: [
            { id: 'ti8', productName: 'OLED TV 55 inç', sku: 'TV-OLED55', quantity: 4 },
            { id: 'ti9', productName: 'Süpürge Robot R300', sku: 'RBT-R300', quantity: 20 },
        ],
    },
];

export const SHIPMENTS: Shipment[] = [
    {
        id: 's1', shipmentNo: 'SHP-2024-001',
        supplier: 'Arçelik Tedarik A.Ş.', plate: '34 ABC 001', driver: 'Mehmet Demir',
        status: 'expected', expectedDate: '2024-03-02',
        items: [
            { id: 'si1', productName: 'Buzdolabı A320', sku: 'BZDLB-A320', expectedQty: 20 },
            { id: 'si2', productName: 'Çamaşır Makinesi C200', sku: 'CWM-C200', expectedQty: 15 },
        ],
    },
    {
        id: 's2', shipmentNo: 'SHP-2024-002',
        supplier: 'Bosch Lojistik', plate: '06 XY 202', driver: 'Ali Kaya',
        status: 'expected', expectedDate: '2024-03-02',
        notes: 'Kırılgan ürün — yavaş taşıma',
        items: [
            { id: 'si3', productName: 'Fırın X500', sku: 'FRN-X500', expectedQty: 30 },
            { id: 'si4', productName: 'Mikro Fırın M80', sku: 'MFN-M80', expectedQty: 25 },
        ],
    },
    {
        id: 's3', shipmentNo: 'SHP-2024-003',
        supplier: 'Samsung Türkiye', plate: '35 SN 303', driver: 'Ayşe Yılmaz',
        status: 'accepted', expectedDate: '2024-03-01',
        items: [
            { id: 'si5', productName: 'TV 65 inç', sku: 'TV-65-QN', expectedQty: 10, acceptedQty: 10 },
            { id: 'si6', productName: 'OLED TV 55 inç', sku: 'TV-OLED55', expectedQty: 8, acceptedQty: 8 },
        ],
    },
    {
        id: 's4', shipmentNo: 'SHP-2024-004',
        supplier: 'Vestel Lojistik', plate: '45 VT 404', driver: 'Hasan Çelik',
        status: 'partial', expectedDate: '2024-03-01',
        notes: '5 adet hasar görmüş — kısmi kabul',
        items: [
            { id: 'si7', productName: 'Klima 18000 BTU', sku: 'KLM-18K', expectedQty: 20, acceptedQty: 15 },
            { id: 'si8', productName: 'Klima 24000 BTU', sku: 'KLM-24K', expectedQty: 10, acceptedQty: 10 },
        ],
    },
    {
        id: 's5', shipmentNo: 'SHP-2024-005',
        supplier: 'Tefal Dağıtım', plate: '41 TF 505', driver: 'Fatma Arslan',
        status: 'rejected', expectedDate: '2024-02-29',
        notes: 'Evraklar eksik — reddedildi',
        items: [
            { id: 'si9', productName: 'Fritöz AF200', sku: 'AFR-AF200', expectedQty: 50 },
        ],
    },
];

export const PRODUCTS: Product[] = [
    { id: 'p1', name: 'Buzdolabı A320', sku: 'BZDLB-A320', stock: 12 },
    { id: 'p2', name: 'Çamaşır Makinesi C200', sku: 'CWM-C200', stock: 85 },
    { id: 'p3', name: 'Fırın X500', sku: 'FRN-X500', stock: 5 },
    { id: 'p4', name: 'TV 65 inç QN', sku: 'TV-65-QN', stock: 120 },
    { id: 'p5', name: 'Süpürge Robot R300', sku: 'RBT-R300', stock: 24 },
];
