import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, StatusBar, RefreshControl, Animated, FlatList
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Order, OrderStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import SwipeableItem from '../../components/SwipeableItem';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';

const GREEN = '#2A7A50';
const URGENT_HOURS = 24; // 24 saatten eski pending siparişler kırmızı

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', bg: '#E8A02015', icon: 'clock-outline' },
    processing: { label: 'İşlemde', color: '#6C63FF', bg: '#6C63FF15', icon: 'cog-outline' },
    completed: { label: 'Tamamlandı', color: '#2A7A50', bg: '#2A7A5015', icon: 'check-circle-outline' },
    cancelled: { label: 'İptal', color: '#E05C5C', bg: '#E05C5C15', icon: 'close-circle-outline' },
};

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    trendyol: { label: 'Trendyol', bg: '#F27A1A15', color: '#F27A1A', icon: 'shopping' },
    hepsiburada: { label: 'Hepsiburada', bg: '#FF600015', color: '#FF6000', icon: 'shopping-outline' },
    shopify: { label: 'Shopify', bg: '#96BF4815', color: '#96BF48', icon: 'storefront-outline' },
    manual: { label: 'Manuel', bg: '#88888815', color: '#888888', icon: 'hand-back-left-outline' },
};

type FilterKey = OrderStatus | 'all' | 'trendyol' | 'hepsiburada' | 'shopify' | 'manual';

const FILTERS: { key: FilterKey; label: string; icon?: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'pending', label: 'Bekliyor' },
    { key: 'processing', label: 'İşlemde' },
    { key: 'completed', label: 'Tamamlandı' },
    { key: 'trendyol', label: 'Trendyol', icon: 'shopping' },
    { key: 'hepsiburada', label: 'Hepsiburada', icon: 'shopping-outline' },
    { key: 'shopify', label: 'Shopify', icon: 'storefront-outline' },
];

/** Siparişin kaç saat önce oluşturulduğunu hesaplar */
function hoursAgo(dateStr: string): number {
    try {
        const d = new Date(dateStr);
        return (Date.now() - d.getTime()) / 3_600_000;
    } catch {
        return 0;
    }
}

/** Urgency sıralaması: pending (kritik > normal) > processing > completed > cancelled */
function urgencySort(a: Order, b: Order): number {
    const rank = (o: Order): number => {
        if (o.status === 'pending') return hoursAgo(o.date) > URGENT_HOURS ? 0 : 1;
        if (o.status === 'processing') return 2;
        if (o.status === 'completed') return 3;
        return 4;
    };
    return rank(a) - rank(b);
}

type Props = NativeStackScreenProps<any, 'OMS'>;

export default function OMSScreen({ navigation }: Props) {
    const theme = useTheme();
    const orders = useDataStore(s => s.orders);
    const isLoading = useDataStore(s => s.isLoading);
    const loadOrders = useDataStore(s => s.loadOrders);
    const user = useAppStore(s => s.user);
    const isAdmin = user?.role === 'admin';
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [refreshing, setRefreshing] = useState(false);

    // Stat sayıları
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const trendyol = orders.filter(o => o.platformSource === 'trendyol').length;
    const hepsiburada = orders.filter(o => o.platformSource === 'hepsiburada').length;
    const shopify = orders.filter(o => o.platformSource === 'shopify').length;
    const urgentCount = orders.filter(o => o.status === 'pending' && hoursAgo(o.date) > URGENT_HOURS).length;

    const countMap: Record<string, number> = { all: orders.length, pending, processing, completed, cancelled, trendyol, hepsiburada, shopify };

    const onRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const filtered = useMemo(() => {
        const base = orders.filter((o: Order) => {
            let matchFilter = true;
            if (activeFilter !== 'all') {
                if (['trendyol', 'hepsiburada', 'shopify', 'manual'].includes(activeFilter)) {
                    matchFilter = o.platformSource === activeFilter;
                } else {
                    matchFilter = o.status === activeFilter as OrderStatus;
                }
            }
            const matchSearch = o.orderNo.toLowerCase().includes(debouncedSearch.toLowerCase())
                || o.customer.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchFilter && matchSearch;
        });
        return [...base].sort(urgencySort);
    }, [orders, activeFilter, debouncedSearch]);

    return (
        <View style={[s.root, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

            {/* Admin FAB */}
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateOrder')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Acil uyarı banner */}
            {urgentCount > 0 && (
                <UrgentBanner count={urgentCount} onPress={() => setActiveFilter('pending')} />
            )}

            {/* Üst Özet Bant */}
            <View style={s.summaryRow}>
                <MiniStatCard value={pending} label="Bekliyor" color="#E8A020" />
                <MiniStatCard value={processing} label="İşlemde" color="#6C63FF" />
                <MiniStatCard value={completed} label="Tamam" color="#2A7A50" />
                <MiniStatCard value={cancelled} label="İptal" color="#E05C5C" />
            </View>

            {/* Arama */}
            <View style={[s.searchBox, { backgroundColor: theme.card }]}>
                <Icon source="magnify" size={20} color={theme.textMuted} />
                <TextInput
                    style={[s.searchInput, { color: theme.text }]}
                    placeholder="Sipariş no veya müşteri..."
                    placeholderTextColor={theme.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon source="close-circle" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtreler - sayı badge'li */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    const cnt = countMap[f.key] ?? 0;
                    return (
                        <FilterChip
                            key={f.key}
                            label={f.label}
                            count={cnt}
                            active={active}
                            activeColor={GREEN}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveFilter(f.key);
                            }}
                        />
                    );
                })}
            </ScrollView>

            {/* Sonuç sayısı */}
            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} sipariş</Text>
            )}

            {/* Liste */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[s.list, filtered.length === 0 && { flexGrow: 1 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={10}
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <EmptyState
                            icon="clipboard-off-outline"
                            title="Sipariş Bulunamadı"
                            description={search || activeFilter !== 'all' ? "Arama veya filtreye uygun sonuç yok." : "Henüz hiç sipariş kaydı bulunmuyor."}
                        />
                    )
                }
                renderItem={({ item }) => (
                    <MemoOrderCard
                        order={item}
                        isUrgent={item.status === 'pending' && hoursAgo(item.date) > URGENT_HOURS}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.push('OMSDetail', { order: item });
                        }}
                    />
                )}
            />
        </View>
    );
}

/* ── Acil Uyarı Banner ──────────────────────────────────── */
function UrgentBanner({ count, onPress }: { count: number; onPress: () => void }) {
    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.02, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <Animated.View style={[ub.wrap, { transform: [{ scale: pulse }] }]}>
                <Icon source="alert-circle-outline" size={16} color="#FFF" />
                <Text style={ub.text}>{count} sipariş 24 saattir bekliyor! İşleme al →</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}
const ub = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E05C5C', paddingHorizontal: 16, paddingVertical: 10 },
    text: { fontSize: 12, fontWeight: '700', color: '#FFF', flex: 1 },
});

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

/* ── Filter Chip — sayı badge'li ────────────────────────── */
function FilterChip({ label, count, active, activeColor, onPress }: {
    label: string; count: number; active: boolean; activeColor: string; onPress: () => void;
}) {
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
                <View style={[fc.badge, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Text style={[fc.badgeText, active && { color: 'white' }]}>{count}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
const fc = StyleSheet.create({
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E8E8E8' },
    label: { fontSize: 13, fontWeight: '600', color: '#666' },
    badge: { backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#888' },
});

/* ── Sipariş Kartı ──────────────────────────────────────── */
function OrderCard({ order, isUrgent, onPress }: { order: Order; isUrgent: boolean; onPress: () => void }) {
    const theme = useTheme();
    const cfg = STATUS_CONFIG[order.status];
    const total = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const updateOrderStatus = useDataStore(s => s.updateOrderStatus);
    const loadOrders = useDataStore(s => s.loadOrders);

    // Urgency için kırmızı kenarlık animasyonu
    const urgentAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (isUrgent) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(urgentAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
                    Animated.timing(urgentAnim, { toValue: 0.3, duration: 900, useNativeDriver: false }),
                ])
            ).start();
        }
    }, [isUrgent]);

    const urgentBorderColor = urgentAnim.interpolate({
        inputRange: [0.3, 1],
        outputRange: ['#E05C5C40', '#E05C5C'],
    });

    return (
        <SwipeableItem
            onSwipeRight={order.status === 'pending' || order.status === 'processing' ? async () => {
                const nextStatus = order.status === 'pending' ? 'processing' : 'completed';
                await updateOrderStatus(order.id, nextStatus as OrderStatus);
                await loadOrders();
            } : undefined}
            onSwipeLeft={order.status === 'pending' || order.status === 'processing' ? async () => {
                await updateOrderStatus(order.id, 'cancelled');
                await loadOrders();
            } : undefined}
            rightLabel={order.status === 'pending' ? 'İşleme Al' : 'Tamamla'}
            leftLabel="İptal Et"
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start()}
                    onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
                    activeOpacity={1}
                >
                    <Animated.View style={[
                        s.card,
                        { backgroundColor: theme.card },
                        isUrgent && { borderWidth: 1.5, borderColor: urgentBorderColor }
                    ]}>
                        {isUrgent && (
                            <View style={s.urgentStrip}>
                                <Icon source="alert-circle-outline" size={11} color="#FFF" />
                                <Text style={s.urgentText}>+24 saat bekliyor</Text>
                            </View>
                        )}
                        <View style={s.cardRow}>
                            <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
                                <Icon source={cfg.icon} size={18} color={cfg.color} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[s.cardOrderNo, { color: theme.text }]}>{order.orderNo}</Text>
                                    
                                    {/* Platform Badge */}
                                    {order.platformSource && PLATFORM_CONFIG[order.platformSource] && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: PLATFORM_CONFIG[order.platformSource].bg, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                                            <Icon source={PLATFORM_CONFIG[order.platformSource].icon} size={10} color={PLATFORM_CONFIG[order.platformSource].color} />
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: PLATFORM_CONFIG[order.platformSource].color }}>
                                                {PLATFORM_CONFIG[order.platformSource].label}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[s.cardCustomer, { color: theme.textMuted }]} numberOfLines={1}>{order.customer}</Text>
                            </View>
                            <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                                <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        </View>
                        <View style={[s.cardDivider, { backgroundColor: theme.divider }]} />
                        <View style={s.cardFooter}>
                            <View style={s.footerItem}>
                                <Icon source="package-variant" size={13} color={theme.textMuted} />
                                <Text style={[s.footerText, { color: theme.textMuted }]}>{order.items.length} kalem</Text>
                            </View>
                            <View style={s.footerItem}>
                                <Icon source="calendar-outline" size={13} color={theme.textMuted} />
                                <Text style={[s.footerText, { color: theme.textMuted }]}>{order.date}</Text>
                            </View>
                            <Text style={[s.totalText, { color: theme.text }]}>₺{total.toLocaleString('tr-TR')}</Text>
                        </View>
                        {order.notes && (
                            <View style={s.noteRow}>
                                <Icon source="information-outline" size={12} color="#2A7A50" />
                                <Text style={s.noteText} numberOfLines={1}>{order.notes}</Text>
                            </View>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </SwipeableItem>
    );
}

const MemoOrderCard = memo(OrderCard, (prev, next) =>
    prev.order.id === next.order.id &&
    prev.order.status === next.order.status &&
    prev.isUrgent === next.isUrgent
);

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
        borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
        overflow: 'hidden',
    },
    urgentStrip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#E05C5C', paddingHorizontal: 10, paddingVertical: 4,
        marginHorizontal: -16, marginTop: -16, marginBottom: 12,
    },
    urgentText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    cardOrderNo: { fontSize: 14, fontWeight: '800' },
    cardCustomer: { fontSize: 12, marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },
    cardDivider: { height: 1, marginVertical: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11.5 },
    totalText: { marginLeft: 'auto', fontSize: 15, fontWeight: '800' },
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
