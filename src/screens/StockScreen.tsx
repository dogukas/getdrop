import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useDataStore, Product } from '../store/useDataStore';
import { useActivityStore } from '../store/useActivityStore';
import { useToast } from '../context/ToastContext';
import { useAppStore } from '../store/useAppStore';

const GREEN = '#2A7A50';

type Filter = 'all' | 'critical' | 'low' | 'ok';

function getStatus(stock: number, minStock: number): { label: string; color: string; level: Filter } {
    if (stock === 0) return { label: 'Tükendi', color: '#E05C5C', level: 'critical' };
    if (stock < minStock * 0.5) return { label: 'Kritik', color: '#E05C5C', level: 'critical' };
    if (stock < minStock) return { label: 'Düşük', color: '#E8A020', level: 'low' };
    return { label: 'Normal', color: '#2A7A50', level: 'ok' };
}

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'critical', label: 'Kritik' },
    { key: 'low', label: 'Düşük' },
    { key: 'ok', label: 'Normal' },
];

export default function StockScreen() {
    const products = useDataStore(s => s.products);
    const adjustStock = useDataStore(s => s.adjustStock);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();
    const { user } = useAppStore();
    const canEdit = user?.role === 'admin' || user?.role === 'operator';

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');

    const critical = products.filter(p => getStatus(p.stock, p.minStock).level === 'critical').length;
    const low = products.filter(p => getStatus(p.stock, p.minStock).level === 'low').length;

    const filtered = products.filter((p: Product) => {
        const st = getStatus(p.stock, p.minStock);
        const matchF = filter === 'all' || st.level === filter;
        const matchS = p.name.toLowerCase().includes(search.toLowerCase())
            || p.sku.toLowerCase().includes(search.toLowerCase());
        return matchF && matchS;
    });

    const handleAdjust = (product: Product, delta: number) => {
        if (!canEdit) {
            showToast({ message: 'Bu işlem için yetkiniz yok.', type: 'error' });
            return;
        }
        const label = delta > 0 ? `+${delta} stok eklendi` : `${delta} stok düşüldü`;
        Alert.alert(
            delta > 0 ? 'Stok Ekle' : 'Stok Düş',
            `${product.name} için ${Math.abs(delta)} adet ${delta > 0 ? 'eklenecek' : 'düşülecek'}.`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Onayla',
                    onPress: () => {
                        adjustStock(product.sku, delta);
                        addLog({
                            level: delta > 0 ? 'success' : 'warning',
                            title: `Stok Düzeltme: ${product.name}`,
                            description: `${label}. Yeni stok: ${Math.max(0, product.stock + delta)} adet.`,
                            module: 'Stok',
                            entityId: product.id,
                            user: user?.name,
                        });
                        showToast({
                            message: `${product.name}: ${label}`,
                            type: delta > 0 ? 'success' : 'info',
                        });
                    }
                }
            ]
        );
    };

    return (
        <View style={s.root}>

            {/* Özet Banneri */}
            <View style={s.summaryBar}>
                <SummaryChip icon="package-variant-closed-check" value={products.length} label="Toplam Ürün" color="#2A7A50" />
                <SummaryChip icon="alert-circle-outline" value={critical} label="Kritik" color="#E05C5C" />
                <SummaryChip icon="alert-outline" value={low} label="Düşük Stok" color="#E8A020" />
            </View>

            {/* Arama */}
            <View style={s.searchBox}>
                <Icon source="magnify" size={20} color="#AAA" />
                <TextInput style={s.searchInput} placeholder="Ürün adı veya SKU..." placeholderTextColor="#AAA"
                    value={search} onChangeText={setSearch} />
            </View>

            {/* Filtreler */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map(f => {
                    const active = filter === f.key;
                    return (
                        <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                            style={[s.chip, active && { backgroundColor: GREEN }]}>
                            <Text style={[s.chipLabel, active && { color: 'white' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Liste */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
                {filtered.map((product: Product) => {
                    const st = getStatus(product.stock, product.minStock);
                    const pct = Math.min(product.stock / Math.max(product.minStock, 1), 1);
                    return (
                        <View key={product.id} style={s.card}>
                            <View style={s.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.itemName}>{product.name}</Text>
                                    <Text style={s.itemSku}>{product.sku}</Text>
                                </View>
                                <View style={[s.badge, { backgroundColor: `${st.color}18` }]}>
                                    <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                                </View>
                            </View>

                            {/* Stok bar */}
                            <View style={s.barBg}>
                                <View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: st.color }]} />
                            </View>

                            <View style={s.cardBottom}>
                                <Text style={s.qtyText}>
                                    <Text style={{ fontWeight: '800', color: st.color, fontSize: 17 }}>{product.stock}</Text>
                                    <Text style={s.minText}> / {product.minStock} {product.unit} (min)</Text>
                                </Text>
                                {canEdit && (
                                    <View style={s.adjustRow}>
                                        <TouchableOpacity style={s.adjBtn} onPress={() => handleAdjust(product, -10)} activeOpacity={0.7}>
                                            <Text style={s.adjBtnText}>-10</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[s.adjBtn, s.adjBtnPos]} onPress={() => handleAdjust(product, 10)} activeOpacity={0.7}>
                                            <Text style={[s.adjBtnText, { color: GREEN }]}>+10</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function SummaryChip({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
    return (
        <View style={[sc.wrap, { borderTopColor: color }]}>
            <Icon source={icon} size={16} color={color} />
            <Text style={[sc.val, { color }]}>{value}</Text>
            <Text style={sc.lbl}>{label}</Text>
        </View>
    );
}
const sc = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', borderTopWidth: 2, paddingTop: 10, gap: 3 },
    val: { fontSize: 18, fontWeight: '800' },
    lbl: { fontSize: 10, color: '#888' },
});

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    summaryBar: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 14, gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, marginTop: 12, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    filterBar: { maxHeight: 52, marginBottom: 4 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
    chipLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    itemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 11, color: '#AAA', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    barBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    qtyText: { fontSize: 13, color: '#1A1A1A' },
    minText: { fontSize: 12, color: '#888', fontWeight: '400' },
    adjustRow: { flexDirection: 'row', gap: 6 },
    adjBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: '#E05C5C18', borderWidth: 1, borderColor: '#E05C5C40' },
    adjBtnPos: { backgroundColor: `${GREEN}12`, borderColor: `${GREEN}40` },
    adjBtnText: { fontSize: 12, fontWeight: '800', color: '#E05C5C' },
});
