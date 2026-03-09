import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Shipment, ShipmentStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

const ORANGE = '#E8A020';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string }> = {
    expected: { label: 'Bekleniyor', color: ORANGE, bg: '#E8A02018' },
    accepted: { label: 'Kabul', color: '#2A7A50', bg: '#2A7A5018' },
    partial: { label: 'Kısmi', color: '#6C63FF', bg: '#6C63FF18' },
    rejected: { label: 'Ret', color: '#E05C5C', bg: '#E05C5C18' },
};

const FILTERS: { key: ShipmentStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'expected', label: 'Bekleniyor' },
    { key: 'accepted', label: 'Kabul' },
    { key: 'partial', label: 'Kısmi' },
    { key: 'rejected', label: 'Ret' },
];

type Props = NativeStackScreenProps<any, 'Sevkiyat'>;

export default function SevkiyatScreen({ navigation }: Props) {
    const shipments = useDataStore(s => s.shipments);
    const isLoading = useDataStore(s => s.isLoading);
    const loadShipments = useDataStore(s => s.loadShipments);
    const user = useAppStore(s => s.user);
    const isAdmin = user?.role === 'admin';
    const [activeFilter, setActiveFilter] = useState<ShipmentStatus | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadShipments();
        setRefreshing(false);
    }, []);

    const filtered = shipments.filter(
        (s: Shipment) => activeFilter === 'all' || s.status === activeFilter
    );

    return (
        <View style={{ ...s.root }}>
            {/* Admin FAB */}
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateShipment')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                        <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)}
                            style={[s.chip, active && { backgroundColor: ORANGE }]}>
                            <Text style={[s.chipLabel, active && { color: 'white' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
            >
                {isLoading ? (
                    <SkeletonList count={4} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="truck-off-outline"
                        title="Sevkiyat Bulunamadı"
                        description={activeFilter !== 'all' ? "Filtreye uygun sevkiyat yok." : "Henüz hiç sevkiyat kaydı yok."}
                    />
                ) : (
                    filtered.map((s) => (
                        <ShipmentCard key={s.id} shipment={s} onPress={() => navigation.push('SevkiyatDetail', { shipment: s })} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function ShipmentCard({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
    const cfg = STATUS_CONFIG[shipment.status];
    const totalExpected = shipment.items.reduce((s, i) => s + i.expectedQty, 0);
    const totalAccepted = shipment.items.reduce((s, i) => s + (i.acceptedQty ?? 0), 0);

    return (
        <TouchableOpacity onPress={onPress} style={s.card} activeOpacity={0.85}>
            <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={s.cardNo}>{shipment.shipmentNo}</Text>
                    <Text style={s.supplier}>{shipment.supplier}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            <View style={s.truckRow}>
                <View style={s.truckInfo}>
                    <Icon source="truck-outline" size={14} color="#888" />
                    <Text style={s.truckText}>{shipment.plate} · {shipment.driver}</Text>
                </View>
                <View style={s.truckInfo}>
                    <Icon source="calendar-outline" size={14} color="#888" />
                    <Text style={s.truckText}>{shipment.expectedDate}</Text>
                </View>
            </View>

            <View style={s.qtyBar}>
                <View style={s.qtyItem}>
                    <Text style={s.qtyNum}>{totalExpected}</Text>
                    <Text style={s.qtyLbl}>Beklenen</Text>
                </View>
                <View style={s.qtyDiv} />
                <View style={s.qtyItem}>
                    <Text style={[s.qtyNum, { color: '#2A7A50' }]}>{totalAccepted}</Text>
                    <Text style={s.qtyLbl}>Kabul</Text>
                </View>
                <View style={s.qtyDiv} />
                <View style={s.qtyItem}>
                    <Text style={[s.qtyNum, { color: '#E05C5C' }]}>{totalExpected - totalAccepted}</Text>
                    <Text style={s.qtyLbl}>Fark</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    filterBar: { maxHeight: 60, paddingTop: 12 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
    chipLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    cardNo: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    supplier: { fontSize: 13, color: '#666', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    truckRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
    truckInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    truckText: { fontSize: 12, color: '#888' },
    qtyBar: { flexDirection: 'row', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12 },
    qtyItem: { flex: 1, alignItems: 'center' },
    qtyNum: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    qtyLbl: { fontSize: 10, color: '#888', marginTop: 2 },
    qtyDiv: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: ORANGE, shadowOpacity: 0.4, shadowRadius: 10, zIndex: 99 },
});
