import React, { useState, useRef, useMemo, memo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Animated, FlatList } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Transfer, TransferStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';

const PURPLE = '#6C63FF';

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', bg: '#E8A02015', icon: 'clock-outline' },
    in_transit: { label: 'Aktarımda', color: '#6C63FF', bg: '#6C63FF15', icon: 'truck-fast-outline' },
    delivered: { label: 'Teslim', color: '#2A7A50', bg: '#2A7A5015', icon: 'check-circle-outline' },
    rejected: { label: 'Reddedildi', color: '#E05C5C', bg: '#E05C5C15', icon: 'close-circle-outline' },
};

const FILTERS: { key: TransferStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'pending', label: 'Bekliyor' },
    { key: 'in_transit', label: 'Aktarımda' },
    { key: 'delivered', label: 'Teslim' },
    { key: 'rejected', label: 'Reddedildi' },
];

type Props = NativeStackScreenProps<any, 'Transfer'>;

export default function TransferScreen({ navigation }: Props) {
    const theme = useTheme();
    const transfers = useDataStore(s => s.transfers);
    const isLoading = useDataStore(s => s.isLoading);
    const loadTransfers = useDataStore(s => s.loadTransfers);
    const user = useAppStore(s => s.user);
    const isAdmin = user?.role === 'admin';

    const [activeFilter, setActiveFilter] = useState<TransferStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [refreshing, setRefreshing] = useState(false);

    const pending = transfers.filter(t => t.status === 'pending').length;
    const transit = transfers.filter(t => t.status === 'in_transit').length;
    const delivered = transfers.filter(t => t.status === 'delivered').length;

    const onRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadTransfers();
        setRefreshing(false);
    };

    const filtered = useMemo(() => {
        return transfers.filter((t: Transfer) => {
            const matchStatus = activeFilter === 'all' || t.status === activeFilter;
            const matchSearch = t.transferNo.toLowerCase().includes(debouncedSearch.toLowerCase())
                || t.sourceWarehouse.toLowerCase().includes(debouncedSearch.toLowerCase())
                || t.targetWarehouse.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [transfers, activeFilter, debouncedSearch]);

    return (
        <View style={[s.root, { backgroundColor: theme.bg }]}>
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateTransfer')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Özet */}
            <View style={s.summaryRow}>
                <MiniStat value={pending} label="Bekliyor" color="#E8A020" />
                <MiniStat value={transit} label="Aktarımda" color={PURPLE} />
                <MiniStat value={delivered} label="Teslim" color="#2A7A50" />
            </View>

            {/* Arama */}
            <View style={[s.searchBox, { backgroundColor: theme.card }]}>
                <Icon source="magnify" size={20} color={theme.textMuted} />
                <TextInput
                    style={[s.searchInput, { color: theme.text }]}
                    placeholder="Transfer no veya depo..."
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

            {/* Filtreler */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                        <FilterChip key={f.key} label={f.label} active={active} activeColor={PURPLE} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveFilter(f.key);
                        }} />
                    );
                })}
            </ScrollView>

            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} transfer</Text>
            )}

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[s.list, filtered.length === 0 && { flexGrow: 1 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={10}
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <EmptyState
                            icon="swap-horizontal"
                            title="Transfer Bulunamadı"
                            description={activeFilter !== 'all' || search ? "Arama veya filtreye uygun transfer yok." : "Henüz hiç depo transfer kaydı yok."}
                        />
                    )
                }
                renderItem={({ item }) => (
                    <MemoTransferCard key={item.id} transfer={item} onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.push('TransferDetail', { transfer: item });
                    }} />
                )}
            />
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

function TransferCard({ transfer, onPress }: { transfer: Transfer; onPress: () => void }) {
    const theme = useTheme();
    const cfg = STATUS_CONFIG[transfer.status];
    const totalQty = transfer.items.reduce((s, i) => s + i.quantity, 0);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
                style={[s.card, { backgroundColor: theme.card }]}
                activeOpacity={1}
            >
                {/* Üst */}
                <View style={s.cardHeader}>
                    <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
                        <Icon source={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <Text style={[s.cardNo, { marginLeft: 12, flex: 1, color: theme.text }]}>{transfer.transferNo}</Text>
                    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                {/* Rota Görseli */}
                <View style={s.routeContainer}>
                    <View style={s.routeNode}>
                        <View style={[s.routeDot, { backgroundColor: PURPLE }]} />
                        <View style={s.routeBox}>
                            <Icon source="warehouse" size={12} color={PURPLE} />
                            <Text style={s.routeLabel} numberOfLines={1}>{transfer.sourceWarehouse}</Text>
                        </View>
                    </View>
                    <View style={s.routeLine}>
                        <View style={s.routeLineInner} />
                        <Icon source="arrow-right" size={14} color={PURPLE} />
                    </View>
                    <View style={s.routeNode}>
                        <View style={[s.routeDot, { backgroundColor: '#2A7A50' }]} />
                        <View style={s.routeBox}>
                            <Icon source="warehouse" size={12} color="#2A7A50" />
                            <Text style={s.routeLabel} numberOfLines={1}>{transfer.targetWarehouse}</Text>
                        </View>
                    </View>
                </View>

                <View style={[s.cardDivider, { backgroundColor: theme.divider }]} />
                <View style={s.cardFooter}>
                    <View style={s.footItem}>
                        <Icon source="package-variant" size={13} color={theme.textMuted} />
                        <Text style={[s.footText, { color: theme.textMuted }]}>{transfer.items.length} kalem · {totalQty} adet</Text>
                    </View>
                    <View style={s.footItem}>
                        <Icon source="calendar-outline" size={13} color={theme.textMuted} />
                        <Text style={[s.footText, { color: theme.textMuted }]}>{transfer.plannedDate}</Text>
                    </View>
                </View>

                {transfer.notes && (
                    <View style={s.noteRow}>
                        <Icon source="alert-circle-outline" size={12} color={PURPLE} />
                        <Text style={s.noteText} numberOfLines={1}>{transfer.notes}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const MemoTransferCard = memo(TransferCard, (prev, next) => 
    prev.transfer.id === next.transfer.id && 
    prev.transfer.status === next.transfer.status
);

const s = StyleSheet.create({
    root: { flex: 1 },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
        gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    searchInput: { flex: 1, fontSize: 14 },
    filterBar: { maxHeight: 52, marginBottom: 4 },
    resultCount: { fontSize: 12, color: '#AAA', fontWeight: '600', paddingHorizontal: 16, marginBottom: 6 },
    list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
    card: { borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    cardNo: { fontSize: 14, fontWeight: '800' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },

    routeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeNode: { flex: 1, alignItems: 'center', gap: 4 },
    routeDot: { width: 8, height: 8, borderRadius: 4 },
    routeBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, width: '100%' },
    routeLabel: { fontSize: 11, fontWeight: '600', color: '#333', flex: 1 },
    routeLine: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 12 },
    routeLineInner: { flex: 1, height: 1, backgroundColor: '#DDD' },

    cardDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', gap: 14 },
    footItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footText: { fontSize: 11.5, color: '#AAA' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#6C63FF10', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    noteText: { fontSize: 11, color: PURPLE, flex: 1 },
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 12, zIndex: 99 },
});
