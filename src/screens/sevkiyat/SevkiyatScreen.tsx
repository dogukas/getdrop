import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Shipment, ShipmentStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

const ORANGE = '#E8A020';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; icon: string }> = {
    expected: { label: 'Bekleniyor', color: ORANGE, bg: '#E8A02015', icon: 'truck-outline' },
    accepted: { label: 'Kabul', color: '#2A7A50', bg: '#2A7A5015', icon: 'check-circle-outline' },
    partial: { label: 'Kısmi', color: '#6C63FF', bg: '#6C63FF15', icon: 'percent-outline' },
    rejected: { label: 'Ret', color: '#E05C5C', bg: '#E05C5C15', icon: 'close-circle-outline' },
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
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const expected = shipments.filter(s => s.status === 'expected').length;
    const accepted = shipments.filter(s => s.status === 'accepted').length;
    const rejected = shipments.filter(s => s.status === 'rejected').length;

    const onRefresh = async () => {
        setRefreshing(true);
        await loadShipments();
        setRefreshing(false);
    };

    const filtered = shipments.filter((s: Shipment) => {
        const matchStatus = activeFilter === 'all' || s.status === activeFilter;
        const matchSearch = s.shipmentNo.toLowerCase().includes(search.toLowerCase())
            || s.supplier.toLowerCase().includes(search.toLowerCase())
            || (s.plate ?? '').toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <View style={s.root}>
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateShipment')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Özet */}
            <View style={s.summaryRow}>
                <MiniStat value={expected} label="Bekleniyor" color={ORANGE} />
                <MiniStat value={accepted} label="Kabul" color="#2A7A50" />
                <MiniStat value={rejected} label="Ret" color="#E05C5C" />
            </View>

            {/* Arama */}
            <View style={s.searchBox}>
                <Icon source="magnify" size={20} color="#AAA" />
                <TextInput
                    style={s.searchInput}
                    placeholder="Sevkiyat no, tedarikçi veya plaka..."
                    placeholderTextColor="#AAA"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon source="close-circle" size={18} color="#AAA" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtreler */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                        <FilterChip key={f.key} label={f.label} active={active} activeColor={ORANGE} onPress={() => setActiveFilter(f.key)} />
                    );
                })}
            </ScrollView>

            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} sevkiyat</Text>
            )}

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
                        description={activeFilter !== 'all' || search ? "Arama veya filtreye uygun sevkiyat yok." : "Henüz hiç sevkiyat kaydı yok."}
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

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={[ms.wrap, { backgroundColor: color + '12' }]}>
            <Text style={[ms.val, { color }]}>{value}</Text>
            <Text style={ms.lbl}>{label}</Text>
        </View>
    );
}
const ms = StyleSheet.create({
    wrap: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 2 },
    val: { fontSize: 18, fontWeight: '800' },
    lbl: { fontSize: 10, color: '#999', fontWeight: '600' },
});

function FilterChip({ label, active, activeColor, onPress }: { label: string; active: boolean; activeColor: string; onPress: () => void }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
        onPress();
    };
    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={handlePress}
                style={[fc.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
                activeOpacity={0.8}
            >
                <Text style={[fc.label, active && { color: 'white' }]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}
const fc = StyleSheet.create({
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E8E8E8' },
    label: { fontSize: 13, fontWeight: '600', color: '#666' },
});

function ShipmentCard({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
    const cfg = STATUS_CONFIG[shipment.status];
    const totalExpected = shipment.items.reduce((s, i) => s + i.expectedQty, 0);
    const totalAccepted = shipment.items.reduce((s, i) => s + (i.acceptedQty ?? 0), 0);
    const pct = totalExpected > 0 ? totalAccepted / totalExpected : 0;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const showProgress = shipment.status === 'accepted' || shipment.status === 'partial';

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
                style={s.card}
                activeOpacity={1}
            >
                {/* Üst */}
                <View style={s.cardTop}>
                    <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
                        <Icon source={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.cardNo}>{shipment.shipmentNo}</Text>
                        <Text style={s.supplier} numberOfLines={1}>{shipment.supplier}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                {/* Araç & Tarih */}
                <View style={s.truckRow}>
                    <View style={s.truckInfo}>
                        <Icon source="car-outline" size={13} color="#AAA" />
                        <Text style={s.truckText}>{shipment.plate || '—'} · {shipment.driver || '—'}</Text>
                    </View>
                    <View style={s.truckInfo}>
                        <Icon source="calendar-outline" size={13} color="#AAA" />
                        <Text style={s.truckText}>{shipment.expectedDate}</Text>
                    </View>
                </View>

                {/* Progress (kabul edilmişse) */}
                {showProgress && (
                    <View style={s.progressSection}>
                        <View style={s.progressBarBg}>
                            <View style={[s.progressBarFill, { width: `${pct * 100}%`, backgroundColor: shipment.status === 'partial' ? '#6C63FF' : '#2A7A50' }]} />
                        </View>
                        <Text style={s.progressText}>{totalAccepted}/{totalExpected} kabul (%{Math.round(pct * 100)})</Text>
                    </View>
                )}

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
        </Animated.View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
        gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    filterBar: { maxHeight: 52, marginBottom: 4 },
    resultCount: { fontSize: 12, color: '#AAA', fontWeight: '600', paddingHorizontal: 16, marginBottom: 6 },
    list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    cardNo: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
    supplier: { fontSize: 12, color: '#999', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },
    truckRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
    truckInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    truckText: { fontSize: 11.5, color: '#AAA' },
    progressSection: { marginBottom: 10 },
    progressBarBg: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 10.5, color: '#AAA', fontWeight: '600' },
    qtyBar: { flexDirection: 'row', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12 },
    qtyItem: { flex: 1, alignItems: 'center' },
    qtyNum: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    qtyLbl: { fontSize: 10, color: '#AAA', marginTop: 2 },
    qtyDiv: { width: 1, backgroundColor: '#E8E8E8', marginHorizontal: 4 },
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: ORANGE, shadowOpacity: 0.4, shadowRadius: 12, zIndex: 99 },
});
