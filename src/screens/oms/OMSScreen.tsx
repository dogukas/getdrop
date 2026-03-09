import React, { useState, useRef, useEffect } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, StatusBar, RefreshControl, Animated,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Order, OrderStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

const GREEN = '#2A7A50';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', bg: '#E8A02015', icon: 'clock-outline' },
    processing: { label: 'İşlemde', color: '#6C63FF', bg: '#6C63FF15', icon: 'cog-outline' },
    completed: { label: 'Tamamlandı', color: '#2A7A50', bg: '#2A7A5015', icon: 'check-circle-outline' },
    cancelled: { label: 'İptal', color: '#E05C5C', bg: '#E05C5C15', icon: 'close-circle-outline' },
};

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'pending', label: 'Bekliyor' },
    { key: 'processing', label: 'İşlemde' },
    { key: 'completed', label: 'Tamamlandı' },
    { key: 'cancelled', label: 'İptal' },
];

type Props = NativeStackScreenProps<any, 'OMS'>;

export default function OMSScreen({ navigation }: Props) {
    const orders = useDataStore(s => s.orders);
    const isLoading = useDataStore(s => s.isLoading);
    const loadOrders = useDataStore(s => s.loadOrders);
    const user = useAppStore(s => s.user);
    const isAdmin = user?.role === 'admin';
    const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Stat sayıları
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const filtered = orders.filter((o: Order) => {
        const matchStatus = activeFilter === 'all' || o.status === activeFilter;
        const matchSearch = o.orderNo.toLowerCase().includes(search.toLowerCase())
            || o.customer.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />

            {/* Admin FAB */}
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateOrder')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Üst Özet Bant */}
            <View style={s.summaryRow}>
                <MiniStatCard value={pending} label="Bekliyor" color="#E8A020" />
                <MiniStatCard value={processing} label="İşlemde" color="#6C63FF" />
                <MiniStatCard value={completed} label="Tamam" color="#2A7A50" />
                <MiniStatCard value={cancelled} label="İptal" color="#E05C5C" />
            </View>

            {/* Arama */}
            <View style={s.searchBox}>
                <Icon source="magnify" size={20} color="#AAA" />
                <TextInput
                    style={s.searchInput}
                    placeholder="Sipariş no veya müşteri..."
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
                        <FilterChip
                            key={f.key}
                            label={f.label}
                            active={active}
                            activeColor={GREEN}
                            onPress={() => setActiveFilter(f.key)}
                        />
                    );
                })}
            </ScrollView>

            {/* Sonuç sayısı */}
            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} sipariş</Text>
            )}

            {/* Liste */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
            >
                {isLoading ? (
                    <SkeletonList count={4} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="clipboard-off-outline"
                        title="Sipariş Bulunamadı"
                        description={search || activeFilter !== 'all' ? "Arama veya filtreye uygun sonuç yok." : "Henüz hiç sipariş kaydı bulunmuyor."}
                    />
                ) : (
                    filtered.map((order) => <OrderCard key={order.id} order={order} onPress={() => navigation.push('OMSDetail', { order })} />)
                )}
            </ScrollView>
        </View>
    );
}

/* ── Mini Stat ──────────────────────────────────────────── */
function MiniStatCard({ value, label, color }: { value: number; label: string; color: string }) {
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

/* ── Filter Chip (animasyonlu) ──────────────────────────── */
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

/* ── Sipariş Kartı ──────────────────────────────────────── */
function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
    const cfg = STATUS_CONFIG[order.status];
    const total = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
                style={s.card}
                activeOpacity={1}
            >
                {/* Üst satır */}
                <View style={s.cardRow}>
                    <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
                        <Icon source={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.cardOrderNo}>{order.orderNo}</Text>
                        <Text style={s.cardCustomer} numberOfLines={1}>{order.customer}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={s.cardDivider} />

                {/* Alt satır */}
                <View style={s.cardFooter}>
                    <View style={s.footerItem}>
                        <Icon source="package-variant" size={13} color="#AAA" />
                        <Text style={s.footerText}>{order.items.length} kalem</Text>
                    </View>
                    <View style={s.footerItem}>
                        <Icon source="calendar-outline" size={13} color="#AAA" />
                        <Text style={s.footerText}>{order.date}</Text>
                    </View>
                    <Text style={s.totalText}>₺{total.toLocaleString('tr-TR')}</Text>
                </View>

                {order.notes && (
                    <View style={s.noteRow}>
                        <Icon source="information-outline" size={12} color="#2A7A50" />
                        <Text style={s.noteText} numberOfLines={1}>{order.notes}</Text>
                    </View>
                )}
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

    card: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    cardOrderNo: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
    cardCustomer: { fontSize: 12, color: '#999', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },
    cardDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11.5, color: '#AAA' },
    totalText: { marginLeft: 'auto', fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    noteRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
        backgroundColor: '#2A7A5010', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    },
    noteText: { fontSize: 11, color: '#2A7A50', flex: 1 },
    fab: {
        position: 'absolute', bottom: 24, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#2A7A50', alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: '#2A7A50', shadowOpacity: 0.4, shadowRadius: 12, zIndex: 99,
    },
});
