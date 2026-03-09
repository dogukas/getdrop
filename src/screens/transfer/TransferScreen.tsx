import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Transfer, TransferStatus } from '../../types';
import { SkeletonList } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

const PURPLE = '#6C63FF';

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', bg: '#E8A02018' },
    in_transit: { label: 'Aktarımda', color: '#6C63FF', bg: '#6C63FF18' },
    delivered: { label: 'Teslim', color: '#2A7A50', bg: '#2A7A5018' },
    rejected: { label: 'Reddedildi', color: '#E05C5C', bg: '#E05C5C18' },
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
    const transfers = useDataStore(s => s.transfers);
    const isLoading = useDataStore(s => s.isLoading);
    const loadTransfers = useDataStore(s => s.loadTransfers);
    const user = useAppStore(s => s.user);
    const isAdmin = user?.role === 'admin';
    const [activeFilter, setActiveFilter] = useState<TransferStatus | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTransfers();
        setRefreshing(false);
    }, []);

    const filtered = transfers.filter(
        (t: Transfer) => activeFilter === 'all' || t.status === activeFilter
    );

    return (
        <View style={s.root}>
            {/* Admin FAB */}
            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateTransfer')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}
            {/* Filtreler */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key} onPress={() => setActiveFilter(f.key)}
                            style={[s.filterChip, active && { backgroundColor: PURPLE }]}
                        >
                            <Text style={[s.filterLabel, active && { color: 'white' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Liste */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
            >
                {isLoading ? (
                    <SkeletonList count={4} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="swap-horizontal"
                        title="Transfer Bulunamadı"
                        description={activeFilter !== 'all' ? "Filtreye uygun transfer yok." : "Henüz hiç depo transfer kaydı yok."}
                    />
                ) : (
                    filtered.map((t) => (
                        <TransferCard key={t.id} transfer={t} onPress={() => navigation.push('TransferDetail', { transfer: t })} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function TransferCard({ transfer, onPress }: { transfer: Transfer; onPress: () => void }) {
    const cfg = STATUS_CONFIG[transfer.status];
    const totalQty = transfer.items.reduce((s, i) => s + i.quantity, 0);

    return (
        <TouchableOpacity onPress={onPress} style={s.card} activeOpacity={0.85}>
            <View style={s.cardHeader}>
                <Text style={s.cardNo}>{transfer.transferNo}</Text>
                <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            {/* Rota */}
            <View style={s.routeRow}>
                <View style={s.routeBox}>
                    <Icon source="warehouse" size={14} color={PURPLE} />
                    <Text style={s.routeText} numberOfLines={1}>{transfer.sourceWarehouse}</Text>
                </View>
                <Icon source="arrow-right" size={16} color="#CCC" />
                <View style={s.routeBox}>
                    <Icon source="warehouse" size={14} color="#2A7A50" />
                    <Text style={s.routeText} numberOfLines={1}>{transfer.targetWarehouse}</Text>
                </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.cardFooter}>
                <View style={s.footItem}>
                    <Icon source="package-variant" size={13} color="#888" />
                    <Text style={s.footText}>{transfer.items.length} kalem · {totalQty} adet</Text>
                </View>
                <View style={s.footItem}>
                    <Icon source="calendar-outline" size={13} color="#888" />
                    <Text style={s.footText}>{transfer.plannedDate}</Text>
                </View>
            </View>

            {transfer.notes && (
                <View style={s.noteRow}>
                    <Icon source="alert-circle-outline" size={13} color={PURPLE} />
                    <Text style={s.noteText} numberOfLines={1}>{transfer.notes}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    filterBar: { maxHeight: 60, paddingTop: 12 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
    filterLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardNo: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8F8F8', borderRadius: 8, padding: 8 },
    routeText: { fontSize: 11, fontWeight: '600', color: '#333', flex: 1 },
    cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', gap: 16 },
    footItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footText: { fontSize: 12, color: '#888' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: '#6C63FF10', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    noteText: { fontSize: 11, color: PURPLE, flex: 1 },
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 10, zIndex: 99 },
});
