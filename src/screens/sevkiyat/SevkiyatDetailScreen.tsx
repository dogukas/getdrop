import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShipmentItem, ShipmentStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';

const ORANGE = '#E8A020';
const GREEN = '#2A7A50';

type Props = NativeStackScreenProps<any, 'SevkiyatDetail'>;

export default function SevkiyatDetailScreen({ route }: Props) {
    const shipmentId: string = route.params?.shipment?.id;
    const shipment = useDataStore(s => s.shipments.find(sh => sh.id === shipmentId));
    const acceptShipment = useDataStore(s => s.acceptShipment);
    const rejectShipment = useDataStore(s => s.rejectShipment);
    const partialAcceptShipment = useDataStore(s => s.partialAcceptShipment);

    const { showToast } = useToast();
    const user = useAppStore(s => s.user);
    const [loading, setLoading] = useState(false);

    const [acceptedQtys, setAcceptedQtys] = useState<Record<string, string>>(
        () => Object.fromEntries((route.params?.shipment?.items ?? []).map((i: ShipmentItem) => [i.id, String(i.expectedQty)]))
    );

    if (!shipment) {
        return <View style={s.root}><Text style={{ textAlign: 'center', marginTop: 80 }}>Sevkiyat bulunamadı.</Text></View>;
    }

    const addLog = useActivityStore(s => s.addLog);
    const canEdit = user?.role === 'admin' || user?.role === 'operator';
    const isEditable = shipment.status === 'expected' && canEdit;

    const handleFullAccept = () => {
        Alert.alert('Tam Kabul', 'Tüm ürünler tam adet kabul edilecek ve stoklar güncellenecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await acceptShipment(shipment.id);
                        await addLog({
                            level: 'success',
                            title: `Sevkiyat Kabul: ${shipment.shipmentNo}`,
                            description: `${shipment.supplier} sevkiyatı tam kabul edildi. Stoklar güncellendi.`,
                            module: 'Sevkiyat',
                            entityId: shipment.id,
                            entityNo: shipment.shipmentNo,
                            user: user?.name,
                        });
                        showToast({ message: '✅ Tüm ürünler kabul edildi, stoklar güncellendi!', type: 'success' });
                    } catch {
                        showToast({ message: 'İşlem başarısız.', type: 'error' });
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const handlePartialAccept = () => {
        const entries: { sku: string; qty: number }[] = shipment.items.map(item => ({
            sku: item.sku,
            qty: parseInt(acceptedQtys[item.id] ?? '0'),
        }));
        const hasPartial = shipment.items.some(item => (entries.find(e => e.sku === item.sku)?.qty ?? 0) < item.expectedQty);
        const msg = hasPartial ? 'Bazı ürünler eksik adet ile kabul edilecek.' : 'Tüm ürünler tam adet girilmiş. Tam kabul olarak işlenecek.';

        Alert.alert('Kısmi Kabul', msg, [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await partialAcceptShipment(shipment.id, entries);
                        await addLog({
                            level: 'warning',
                            title: `Kısmi Kabul: ${shipment.shipmentNo}`,
                            description: `${shipment.supplier} − Bazı kalemler eksik kabul edildi.`,
                            module: 'Sevkiyat',
                            entityId: shipment.id,
                            entityNo: shipment.shipmentNo,
                            user: user?.name,
                        });
                        showToast({ message: hasPartial ? '📦 Kısmi kabul tamamlandı.' : '✅ Tam kabul edildi.', type: 'info' });
                    } catch {
                        showToast({ message: 'İşlem başarısız.', type: 'error' });
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const handleReject = () => {
        Alert.alert('Reddet', 'Sevkiyat tümüyle reddedilecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Reddet', style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await rejectShipment(shipment.id);
                        await addLog({
                            level: 'error',
                            title: `Sevkiyat Ret: ${shipment.shipmentNo}`,
                            description: `${shipment.supplier} sevkiyatı reddedildi.`,
                            module: 'Sevkiyat',
                            entityId: shipment.id,
                            entityNo: shipment.shipmentNo,
                            user: user?.name,
                        });
                        showToast({ message: '❌ Sevkiyat reddedildi.', type: 'error' });
                    } catch {
                        showToast({ message: 'İşlem başarısız.', type: 'error' });
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const simulateBarcodeScan = (item: ShipmentItem) => {
        const currentQty = parseInt(acceptedQtys[item.id] ?? '0');
        if (currentQty >= item.expectedQty) {
            showToast({ message: `${item.productName} zaten tam adet okutuldu.`, type: 'info' });
            return;
        }

        // Okutuldu (Titreme + toast ile his verilebilir)
        setAcceptedQtys({ ...acceptedQtys, [item.id]: String(currentQty + 1) });
        showToast({ message: `Barkod Okundu: ${item.productName} (+1)`, type: 'success', duration: 1500 });
    };

    const STATUS_COLORS: Record<ShipmentStatus, string> = {
        expected: ORANGE, accepted: GREEN, partial: '#6C63FF', rejected: '#E05C5C',
    };
    const STATUS_LABELS: Record<ShipmentStatus, string> = {
        expected: 'Bekleniyor', accepted: 'Kabul Edildi', partial: 'Kısmi Kabul', rejected: 'Reddedildi',
    };

    return (
        <View style={s.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Başlık */}
                <View style={s.headerCard}>
                    <View style={[s.headerBanner, { backgroundColor: STATUS_COLORS[shipment.status] + '18' }]}>
                        <View style={[s.headerIconBox, { backgroundColor: STATUS_COLORS[shipment.status] + '25' }]}>
                            <Icon source={shipment.status === 'rejected' ? 'close-circle-outline' : shipment.status === 'accepted' ? 'check-circle-outline' : shipment.status === 'partial' ? 'percent-outline' : 'truck-outline'} size={26} color={STATUS_COLORS[shipment.status]} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.shipNo}>{shipment.shipmentNo}</Text>
                            <Text style={s.supplier}>{shipment.supplier}</Text>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[shipment.status] + '25' }]}>
                            <Text style={[s.statusText, { color: STATUS_COLORS[shipment.status] }]}>
                                {STATUS_LABELS[shipment.status]}
                            </Text>
                        </View>
                    </View>

                    <View style={s.infoGrid}>
                        <InfoRow icon="truck-outline" label="Araç Plakası" value={shipment.plate} />
                        <InfoRow icon="account-outline" label="Sürücü" value={shipment.driver} />
                        <InfoRow icon="calendar-outline" label="Beklenen Tar." value={shipment.expectedDate} />
                        {shipment.notes && (
                            <InfoRow icon="alert-circle-outline" label="Not" value={shipment.notes} noteColor />
                        )}
                    </View>
                </View>

                {/* Ürün Tablosu */}
                <View style={s.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={s.sectionTitle}>
                            Ürünler {isEditable ? '— Kabul Adetlerini Girin' : ''}
                        </Text>
                        {isEditable && (
                            <TouchableOpacity style={s.scanAllBtn} activeOpacity={0.7}>
                                <Icon source="barcode-scan" size={16} color={ORANGE} />
                                <Text style={s.scanAllText}>Kamera</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={s.tableCard}>
                        {/* Tablo başlığı */}
                        <View style={s.tableHead}>
                            <Text style={[s.headCell, { flex: 2 }]}>Ürün</Text>
                            <Text style={s.headCell}>Beklenen</Text>
                            <Text style={s.headCell}>Kabul</Text>
                        </View>
                        {shipment.items.map((item, idx) => {
                            const accepted = parseInt(acceptedQtys[item.id] ?? '0');
                            const diff = item.expectedQty - accepted;
                            return (
                                <View key={item.id}>
                                    {idx > 0 && <View style={s.rowDivider} />}
                                    <View style={s.tableRow}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={s.itemName} numberOfLines={2}>{item.productName}</Text>
                                            <Text style={s.itemSku}>{item.sku}</Text>
                                        </View>
                                        <Text style={s.cellCenter}>{item.expectedQty}</Text>
                                        {isEditable ? (
                                            <View style={[s.cellCenter, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                                                <TextInput
                                                    style={[s.qtyInput, { flex: 0, width: 40 }]}
                                                    keyboardType="numeric"
                                                    value={acceptedQtys[item.id]}
                                                    onChangeText={(v) => setAcceptedQtys({ ...acceptedQtys, [item.id]: v })}
                                                    selectTextOnFocus
                                                />
                                                <TouchableOpacity onPress={() => simulateBarcodeScan(item)} style={s.scanBtn}>
                                                    <Icon source="barcode" size={16} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <Text style={[s.cellCenter, { color: diff > 0 ? '#E05C5C' : GREEN, fontWeight: '700' }]}>
                                                {item.acceptedQty ?? 0}
                                            </Text>
                                        )}
                                    </View>
                                    {!isEditable && diff > 0 && (
                                        <View style={s.diffRow}>
                                            <Icon source="alert" size={12} color="#E05C5C" />
                                            <Text style={s.diffText}>Fark: {diff} adet</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Aksiyon Butonları */}
            {/* Aksiyon Butonları (Yalnızca yetkililer) */}
            {shipment.status === 'expected' && canEdit && (
                <View style={s.actionBar}>
                    <TouchableOpacity style={[s.btn, { backgroundColor: GREEN, flex: 1 }, loading && { opacity: 0.6 }]} disabled={loading} onPress={handleFullAccept} activeOpacity={0.85}>
                        <Icon source="check-all" size={18} color="white" />
                        <Text style={s.btnWhite}>{loading ? '...' : 'Tam Kabul'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, { backgroundColor: '#6C63FF', flex: 1 }, loading && { opacity: 0.6 }]} disabled={loading} onPress={handlePartialAccept} activeOpacity={0.85}>
                        <Icon source="check" size={18} color="white" />
                        <Text style={s.btnWhite}>{loading ? '...' : 'Kısmi Kabul'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, s.rejectBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={handleReject} activeOpacity={0.85}>
                        <Icon source="close" size={18} color="#E05C5C" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function InfoRow({ icon, label, value, noteColor }: { icon: string; label: string; value: string; noteColor?: boolean }) {
    return (
        <View style={ir.row}>
            <Icon source={icon} size={14} color={noteColor ? ORANGE : '#888'} />
            <View>
                <Text style={ir.label}>{label}</Text>
                <Text style={[ir.value, noteColor && { color: ORANGE }]}>{value}</Text>
            </View>
        </View>
    );
}
const ir = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    label: { fontSize: 10, color: '#AAA' },
    value: { fontSize: 13, fontWeight: '600', color: '#333' },
});

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16, gap: 16, paddingBottom: 120 },
    headerCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    headerBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, paddingBottom: 16 },
    headerIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    shipNo: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
    supplier: { fontSize: 13, color: '#666', marginTop: 2 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    infoGrid: { gap: 10, paddingHorizontal: 18, paddingBottom: 16 },
    section: { gap: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    tableCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    tableHead: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
    headCell: { flex: 1, fontSize: 11, fontWeight: '700', color: '#AAA', textAlign: 'center' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    rowDivider: { height: 1, backgroundColor: '#F5F5F5' },
    itemName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 10, color: '#AAA', marginTop: 1 },
    cellCenter: { flex: 1, textAlign: 'center', fontSize: 14, color: '#333' },
    qtyInput: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: GREEN, borderBottomWidth: 2, borderBottomColor: GREEN, paddingVertical: 4, marginHorizontal: 4 },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4, paddingBottom: 6 },
    diffText: { fontSize: 11, color: '#E05C5C' },
    scanBtn: { backgroundColor: ORANGE, width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    scanAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8A02018', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    scanAllText: { fontSize: 12, fontWeight: '700', color: ORANGE },
    actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
    btnWhite: { fontSize: 14, fontWeight: '700', color: 'white' },
    rejectBtn: { backgroundColor: '#E05C5C18', borderWidth: 1, borderColor: '#E05C5C40', paddingHorizontal: 18 },
});
