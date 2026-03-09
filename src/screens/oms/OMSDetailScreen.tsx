import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';

const GREEN = '#2A7A50';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', icon: 'clock-outline' },
    processing: { label: 'İşlemde', color: '#6C63FF', icon: 'cog-outline' },
    completed: { label: 'Tamamlandı', color: '#2A7A50', icon: 'check-circle-outline' },
    cancelled: { label: 'İptal', color: '#E05C5C', icon: 'close-circle-outline' },
};

const TIMELINE: Partial<Record<OrderStatus, { step: string; done: boolean }[]>> = {
    pending: [{ step: 'Sipariş Alındı', done: true }, { step: 'İşleme Alındı', done: false }, { step: 'Hazırlandı', done: false }, { step: 'Teslim', done: false }],
    processing: [{ step: 'Sipariş Alındı', done: true }, { step: 'İşleme Alındı', done: true }, { step: 'Hazırlandı', done: false }, { step: 'Teslim', done: false }],
    completed: [{ step: 'Sipariş Alındı', done: true }, { step: 'İşleme Alındı', done: true }, { step: 'Hazırlandı', done: true }, { step: 'Teslim', done: true }],
    cancelled: [{ step: 'Sipariş Alındı', done: true }, { step: 'İşleme Alındı', done: false }, { step: 'Hazırlandı', done: false }, { step: 'Teslim', done: false }],
};

type Props = NativeStackScreenProps<any, 'OMSDetail'>;

export default function OMSDetailScreen({ route, navigation }: Props) {
    const orderId: string = route.params?.order?.id;

    // Store'dan reaktif sipariş verisi — başka sayfadan değişiklik aninda yansır
    const order = useDataStore(s => s.orders.find(o => o.id === orderId));
    const updateOrderStatus = useDataStore(s => s.updateOrderStatus);
    const completeOrder = useDataStore(s => s.completeOrder);

    const { showToast } = useToast();
    const user = useAppStore(s => s.user);
    const addLog = useActivityStore(s => s.addLog);
    const [loading, setLoading] = useState(false);

    if (!order) {
        return (
            <View style={s.root}><Text style={{ textAlign: 'center', marginTop: 80 }}>Sipariş bulunamadı.</Text></View>
        );
    }

    const cfg = STATUS_CONFIG[order.status];
    const timeline = TIMELINE[order.status] ?? [];
    const total = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const canEdit = user?.role === 'admin' || user?.role === 'operator';

    const handleAction = (action: 'process' | 'cancel' | 'complete') => {
        const messages: Record<string, string> = {
            process: 'Sipariş işleme alınacak. Stok rezervasyonu başlatılsın mı?',
            complete: 'Sipariş tamamlanacak ve ürünler depodan düşülecek. Onaylıyor musunuz?',
            cancel: 'Sipariş iptal edilecek. Onaylıyor musunuz?',
        };
        const titles: Record<string, string> = {
            process: 'İşleme Al',
            complete: 'Tamamla',
            cancel: 'İptal Et',
        };

        Alert.alert(titles[action], messages[action], [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla', style: action === 'cancel' ? 'destructive' : 'default',
                onPress: async () => {
                    setLoading(true);
                    try {
                        if (action === 'complete') {
                            await completeOrder(order.id);
                            await addLog({
                                level: 'success',
                                title: `Sipariş Tamamlandı: ${order.orderNo}`,
                                description: `${order.customer} siparişi tamamlandı. ${order.items.length} kalem stoktan düşüldü.`,
                                module: 'OMS',
                                entityId: order.id,
                                entityNo: order.orderNo,
                                user: user?.name,
                            });
                        } else if (action === 'process') {
                            await updateOrderStatus(order.id, 'processing');
                            await addLog({
                                level: 'info',
                                title: `İşleme Alındı: ${order.orderNo}`,
                                description: `${order.customer} siparişi işleme alındı.`,
                                module: 'OMS',
                                entityId: order.id,
                                entityNo: order.orderNo,
                                user: user?.name,
                            });
                        } else {
                            await updateOrderStatus(order.id, 'cancelled');
                            await addLog({
                                level: 'error',
                                title: `Sipariş İptal: ${order.orderNo}`,
                                description: `${order.customer} siparişi iptal edildi.`,
                                module: 'OMS',
                                entityId: order.id,
                                entityNo: order.orderNo,
                                user: user?.name,
                            });
                        }
                        showToast({
                            message: action === 'complete' ? '✅ Sipariş tamamlandı!' :
                                action === 'process' ? '⚙️ İşleme alındı!' : '❌ İptal edildi.',
                            type: action === 'cancel' ? 'error' : 'success',
                        });
                    } catch (e) {
                        showToast({ message: 'İşlem sırasında hata oluştu.', type: 'error' });
                    } finally {
                        setLoading(false);
                    }
                }
            },
        ]);
    };

    return (
        <View style={s.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Başlık Kart */}
                <View style={s.headerCard}>
                    <View style={s.headerTop}>
                        <View>
                            <Text style={s.orderNo}>{order.orderNo}</Text>
                            <Text style={s.customer}>{order.customer}</Text>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: `${cfg.color}18` }]}>
                            <Icon source={cfg.icon} size={14} color={cfg.color} />
                            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                    <View style={s.infoGrid}>
                        <InfoItem icon="calendar-outline" label="Tarih" value={order.date} />
                        <InfoItem icon="map-marker-outline" label="Adres" value={order.address} />
                        {order.notes && <InfoItem icon="information-outline" label="Not" value={order.notes} />}
                    </View>
                </View>

                {/* Zaman Çizelgesi */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Sipariş Durumu</Text>
                    <View style={s.timelineCard}>
                        {timeline.map((step, idx) => (
                            <View key={idx} style={s.timelineRow}>
                                <View style={[s.timelineDot, step.done && { backgroundColor: GREEN }]}>
                                    {step.done && <Icon source="check" size={10} color="white" />}
                                </View>
                                {idx < timeline.length - 1 && (
                                    <View style={[s.timelineLine, step.done && { backgroundColor: GREEN }]} />
                                )}
                                <Text style={[s.timelineLabel, step.done && { color: '#1A1A1A', fontWeight: '700' }]}>
                                    {step.step}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Ürün Listesi */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Ürünler ({order.items.length} Kalem)</Text>
                    <View style={s.itemCard}>
                        {order.items.map((item, idx) => (
                            <View key={item.id}>
                                {idx > 0 && <View style={s.itemDivider} />}
                                <View style={s.itemRow}>
                                    <View style={s.itemIcon}>
                                        <Icon source="package-variant" size={18} color={GREEN} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.itemName}>{item.productName}</Text>
                                        <Text style={s.itemSku}>{item.sku}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={s.itemQty}>{item.quantity} adet</Text>
                                        <Text style={s.itemPrice}>₺{(item.quantity * item.unitPrice).toLocaleString('tr-TR')}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        <View style={[s.itemDivider, { borderStyle: 'solid' }]} />
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Toplam Tutar</Text>
                            <Text style={s.totalValue}>₺{total.toLocaleString('tr-TR')}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Aksiyon Butonları */}
            {/* Aksiyon Butonları (Yalnızca Admin ve Operator görebilir) */}
            {(order.status === 'pending' || order.status === 'processing') && canEdit && (
                <View style={s.actionBar}>
                    {order.status === 'pending' && (
                        <TouchableOpacity style={[s.actionBtn, s.primaryBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => handleAction('process')} activeOpacity={0.85}>
                            <Icon source="cog-outline" size={18} color="white" />
                            <Text style={s.primaryBtnText}>{loading ? 'İşleniyor...' : 'İşleme Al'}</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'processing' && (
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#4CAF50' }, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => handleAction('complete')} activeOpacity={0.85}>
                            <Icon source="check-circle-outline" size={18} color="white" />
                            <Text style={s.primaryBtnText}>{loading ? 'İşleniyor...' : 'Tamamla ✓'}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.actionBtn, s.dangerBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => handleAction('cancel')} activeOpacity={0.85}>
                        <Icon source="close-circle-outline" size={18} color="#E05C5C" />
                        <Text style={s.dangerBtnText}>İptal Et</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={s.infoItem}>
            <Icon source={icon} size={14} color="#888" />
            <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16, gap: 16, paddingBottom: 120 },
    headerCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    orderNo: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    customer: { fontSize: 14, color: '#666', marginTop: 3 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    infoGrid: { gap: 10 },
    infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoLabel: { fontSize: 11, color: '#AAA', marginBottom: 1 },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '500', flexWrap: 'wrap' },
    section: { gap: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    timelineCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative', marginBottom: 4 },
    timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    timelineLine: { position: 'absolute', left: 11, top: 28, width: 2, height: 28, backgroundColor: '#E0E0E0' },
    timelineLabel: { fontSize: 13, color: '#999', paddingVertical: 12 },
    itemCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: `${GREEN}14`, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 11, color: '#AAA', marginTop: 1 },
    itemQty: { fontSize: 12, color: '#666', fontWeight: '600' },
    itemPrice: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
    itemDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
    totalLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
    totalValue: { fontSize: 18, fontWeight: '800', color: GREEN },
    actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    primaryBtn: { backgroundColor: GREEN },
    primaryBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
    dangerBtn: { backgroundColor: '#E05C5C18', borderWidth: 1, borderColor: '#E05C5C40' },
    dangerBtnText: { fontSize: 15, fontWeight: '700', color: '#E05C5C' },
});
