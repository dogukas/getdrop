import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Transfer, TransferStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';

const PURPLE = '#6C63FF';
const GREEN = '#2A7A50';

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', icon: 'clock-outline' },
    in_transit: { label: 'Aktarımda', color: PURPLE, icon: 'truck-outline' },
    delivered: { label: 'Teslim', color: GREEN, icon: 'check-circle-outline' },
    rejected: { label: 'Reddedildi', color: '#E05C5C', icon: 'close-circle-outline' },
};

type Props = NativeStackScreenProps<any, 'TransferDetail'>;

export default function TransferDetailScreen({ route }: Props) {
    const transferId: string = route.params?.transfer?.id;
    const transfer = useDataStore(s => s.transfers.find(t => t.id === transferId));
    const updateTransferStatus = useDataStore(s => s.updateTransferStatus);

    const { showToast } = useToast();
    const user = useAppStore(s => s.user);
    const addLog = useActivityStore(s => s.addLog);
    const [loading, setLoading] = useState(false);

    if (!transfer) {
        return <View style={s.root}><Text style={{ textAlign: 'center', marginTop: 80 }}>Transfer bulunamadı.</Text></View>;
    }
    const cfg = STATUS_CONFIG[transfer.status];
    const totalQty = transfer.items.reduce((sum, i) => sum + i.quantity, 0);
    const canEdit = user?.role === 'admin' || user?.role === 'operator';

    const handleAction = (action: 'approve' | 'reject') => {
        const newStatus: TransferStatus = action === 'approve' ? 'in_transit' : 'rejected';
        const msg = action === 'approve'
            ? 'Transfer onaylanacak ve aktarım başlayacak.'
            : 'Transfer reddedilecek.';

        Alert.alert(action === 'approve' ? 'Onayla' : 'Reddet', msg, [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla', style: action === 'reject' ? 'destructive' : 'default',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await updateTransferStatus(transfer.id, newStatus);
                        showToast({
                            message: action === 'approve' ? '🚚 Transfer onaylandı!' : '❌ Transfer reddedildi.',
                            type: action === 'approve' ? 'success' : 'error',
                        });
                    } catch (e: any) {
                        console.error('[TransferDetail] handleAction error:', e);
                        const msg = e?.message || e?.error_description || JSON.stringify(e);
                        showToast({ message: `İşlem başarısız: ${msg}`, type: 'error' });
                        setLoading(false);
                        return;
                    }
                    try {
                        await addLog({
                            level: action === 'approve' ? 'info' : 'error',
                            title: action === 'approve' ? `Transfer Onaylandı: ${transfer.transferNo}` : `Transfer Reddedildi: ${transfer.transferNo}`,
                            description: action === 'approve'
                                ? `${transfer.sourceWarehouse} → ${transfer.targetWarehouse} transferi aktarımda.`
                                : `${transfer.sourceWarehouse} → ${transfer.targetWarehouse} transferi reddedildi.`,
                            module: 'Transfer',
                            entityId: transfer.id,
                            entityNo: transfer.transferNo,
                            user: user?.name,
                        });
                    } catch (logErr) {
                        console.warn('[TransferDetail] addLog error (non-fatal):', logErr);
                    } finally {
                        setLoading(false);
                    }
                }
            },
        ]);
    };

    const markDelivered = () => {
        Alert.alert('Teslim Edildi', 'Transfer teslim edildi olarak işaretlenecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await updateTransferStatus(transfer.id, 'delivered');
                        showToast({ message: '✅ Transfer başarıyla teslim alındı.', type: 'success' });
                    } catch (e: any) {
                        console.error('[TransferDetail] markDelivered error:', e);
                        const errMsg = e?.message || e?.error_description || JSON.stringify(e);
                        showToast({ message: `İşlem başarısız: ${errMsg}`, type: 'error' });
                        setLoading(false);
                        return;
                    }
                    try {
                        await addLog({
                            level: 'success',
                            title: `Transfer Teslim: ${transfer.transferNo}`,
                            description: `${transfer.targetWarehouse} deposuna teslim edildi.`,
                            module: 'Transfer',
                            entityId: transfer.id,
                            entityNo: transfer.transferNo,
                            user: user?.name,
                        });
                    } catch (logErr) {
                        console.warn('[TransferDetail] addLog error (non-fatal):', logErr);
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

                {/* Başlık */}
                <View style={s.headerCard}>
                    <View style={[s.headerBanner, { backgroundColor: cfg.color + '18' }]}>
                        <View style={[s.iconBox, { backgroundColor: cfg.color + '25' }]}>
                            <Icon source={cfg.icon} size={26} color={cfg.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.tNo}>{transfer.transferNo}</Text>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: cfg.color + '25' }]}>
                            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>

                    {/* Rota Görselleştirme */}
                    <View style={[s.routeCard, { marginHorizontal: 18 }]}>
                        <View style={s.routeStation}>
                            <View style={[s.routeDot, { backgroundColor: PURPLE }]} />
                            <Text style={s.routeLabel}>Kaynak</Text>
                            <Text style={s.routeWarehouse}>{transfer.sourceWarehouse}</Text>
                        </View>
                        <View style={s.routeLine}>
                            <View style={s.routeArrow} />
                            <Icon source="truck-outline" size={20} color={PURPLE} />
                            <View style={[s.routeArrow, { transform: [{ scaleX: -1 }] }]} />
                        </View>
                        <View style={[s.routeStation, { alignItems: 'flex-end' }]}>
                            <View style={[s.routeDot, { backgroundColor: GREEN }]} />
                            <Text style={s.routeLabel}>Hedef</Text>
                            <Text style={s.routeWarehouse}>{transfer.targetWarehouse}</Text>
                        </View>
                    </View>

                    <View style={[s.infoRow, { marginHorizontal: 18, marginBottom: 18 }]}>
                        <InfoChip icon="calendar-outline" value={transfer.plannedDate} />
                        <InfoChip icon="package-variant" value={`${transfer.items.length} kalem · ${totalQty} adet`} />
                    </View>

                    {transfer.notes && (
                        <View style={[s.noteBox, { marginHorizontal: 18, marginBottom: 18 }]}>
                            <Icon source="alert-circle-outline" size={14} color={PURPLE} />
                            <Text style={s.noteText}>{transfer.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Ürünler */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Transfer Ürünleri</Text>
                    <View style={s.itemCard}>
                        {transfer.items.map((item, idx) => (
                            <View key={item.id}>
                                {idx > 0 && <View style={s.divider} />}
                                <View style={s.itemRow}>
                                    <View style={s.itemIcon}>
                                        <Icon source="package-variant" size={18} color={PURPLE} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.itemName}>{item.productName}</Text>
                                        <Text style={s.itemSku}>{item.sku}</Text>
                                    </View>
                                    <View style={s.qtyBadge}>
                                        <Text style={s.qtyText}>{item.quantity} adet</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Aksiyon Butonları (Viewer göremez) */}
            {transfer.status === 'pending' && canEdit && (
                <View style={s.actionBar}>
                    <TouchableOpacity style={[s.btn, s.approveBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => handleAction('approve')} activeOpacity={0.85}>
                        <Icon source="check" size={18} color="white" />
                        <Text style={s.approveTxt}>{loading ? 'İşleniyor...' : 'Onayla'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, s.rejectBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => handleAction('reject')} activeOpacity={0.85}>
                        <Icon source="close" size={18} color="#E05C5C" />
                        <Text style={s.rejectTxt}>Reddet</Text>
                    </TouchableOpacity>
                </View>
            )}
            {transfer.status === 'in_transit' && canEdit && (
                <View style={s.actionBar}>
                    <TouchableOpacity style={[s.btn, s.approveBtn, { flex: 1 }, loading && { opacity: 0.6 }]} disabled={loading} onPress={markDelivered} activeOpacity={0.85}>
                        <Icon source="truck-check-outline" size={18} color="white" />
                        <Text style={s.approveTxt}>{loading ? 'İşleniyor...' : 'Teslim Edildi Olarak İşaretle'}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function InfoChip({ icon, value }: { icon: string; value: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon source={icon} size={13} color="#888" />
            <Text style={{ fontSize: 12, color: '#888' }}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16, gap: 16, paddingBottom: 120 },
    headerCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4, gap: 0 },
    headerBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, paddingBottom: 16 },
    iconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tNo: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    routeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14 },
    routeStation: { flex: 1 },
    routeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
    routeLabel: { fontSize: 10, color: '#AAA', marginBottom: 2 },
    routeWarehouse: { fontSize: 12, fontWeight: '700', color: '#333' },
    routeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
    routeArrow: { flex: 1, height: 1, backgroundColor: '#DDD' },
    infoRow: { flexDirection: 'row', gap: 16 },
    noteBox: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#6C63FF10', borderRadius: 10, padding: 10 },
    noteText: { fontSize: 12, color: PURPLE, flex: 1 },
    section: { gap: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    itemCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#6C63FF14', alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 11, color: '#AAA', marginTop: 1 },
    qtyBadge: { backgroundColor: '#6C63FF14', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    qtyText: { fontSize: 12, fontWeight: '700', color: PURPLE },
    divider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 4 },
    actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    approveBtn: { backgroundColor: GREEN },
    approveTxt: { fontSize: 15, fontWeight: '700', color: 'white' },
    rejectBtn: { backgroundColor: '#E05C5C18', borderWidth: 1, borderColor: '#E05C5C40' },
    rejectTxt: { fontSize: 15, fontWeight: '700', color: '#E05C5C' },
});
