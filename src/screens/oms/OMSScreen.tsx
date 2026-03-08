import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, StatusBar, RefreshControl,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDataStore } from '../../store/useDataStore';
import { Order, OrderStatus } from '../../types';

const GREEN = '#2A7A50';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: '#E8A020', bg: '#E8A02018' },
    processing: { label: 'İşlemde', color: '#6C63FF', bg: '#6C63FF18' },
    completed: { label: 'Tamamlandı', color: '#2A7A50', bg: '#2A7A5018' },
    cancelled: { label: 'İptal', color: '#E05C5C', bg: '#E05C5C18' },
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
    const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1200);
    };

    const filtered = orders.filter((o: Order) => {
        const matchStatus = activeFilter === 'all' || o.status === activeFilter;
        const matchSearch = o.orderNo.toLowerCase().includes(search.toLowerCase())
            || o.customer.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" />

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
                        <TouchableOpacity
                            key={f.key}
                            onPress={() => setActiveFilter(f.key)}
                            style={[s.filterChip, active && { backgroundColor: GREEN }]}
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
            >
                {filtered.length === 0 ? (
                    <View style={s.empty}>
                        <Icon source="clipboard-off-outline" size={48} color="#CCC" />
                        <Text style={s.emptyText}>Sonuç bulunamadı</Text>
                    </View>
                ) : (
                    filtered.map((order) => <OrderCard key={order.id} order={order} onPress={() => navigation.push('OMSDetail', { order })} />)
                )}
            </ScrollView>
        </View>
    );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
    const cfg = STATUS_CONFIG[order.status];
    const total = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    return (
        <TouchableOpacity onPress={onPress} style={s.card} activeOpacity={0.85}>
            <View style={s.cardRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.cardOrderNo}>{order.orderNo}</Text>
                    <Text style={s.cardCustomer}>{order.customer}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.cardFooter}>
                <View style={s.footerItem}>
                    <Icon source="package-variant" size={14} color="#888" />
                    <Text style={s.footerText}>{order.items.length} kalem</Text>
                </View>
                <View style={s.footerItem}>
                    <Icon source="calendar-outline" size={14} color="#888" />
                    <Text style={s.footerText}>{order.date}</Text>
                </View>
                <Text style={s.totalText}>
                    ₺{total.toLocaleString('tr-TR')}
                </Text>
            </View>

            {order.notes && (
                <View style={s.noteRow}>
                    <Icon source="information-outline" size={13} color={GREEN} />
                    <Text style={s.noteText} numberOfLines={1}>{order.notes}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    filterBar: { maxHeight: 52, marginBottom: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
    filterLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 15, color: '#AAA' },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    cardOrderNo: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    cardCustomer: { fontSize: 13, color: '#666', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 12, color: '#888' },
    totalText: { marginLeft: 'auto', fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: `${GREEN}0D`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    noteText: { fontSize: 11, color: GREEN, flex: 1 },
});
