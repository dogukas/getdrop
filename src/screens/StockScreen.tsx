import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Product } from '../types/database';
import { useDataStore } from '../store/useDataStore';
import { useActivityStore } from '../store/useActivityStore';
import { useToast } from '../context/ToastContext';
import { useAppStore } from '../store/useAppStore';
import { SkeletonList } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import BarcodeScanner from '../components/BarcodeScanner';

const GREEN = '#2A7A50';

type Filter = 'all' | 'critical' | 'low' | 'ok';

function getStatus(stock: number, minStock: number): { label: string; color: string; level: Filter; icon: string } {
    if (stock === 0) return { label: 'Tükendi', color: '#E05C5C', level: 'critical', icon: 'close-circle-outline' };
    if (stock < minStock * 0.5) return { label: 'Kritik', color: '#E05C5C', level: 'critical', icon: 'alert-circle-outline' };
    if (stock < minStock) return { label: 'Düşük', color: '#E8A020', level: 'low', icon: 'alert-outline' };
    return { label: 'Normal', color: '#2A7A50', level: 'ok', icon: 'check-circle-outline' };
}

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'critical', label: '🔴 Kritik' },
    { key: 'low', label: '🟡 Düşük' },
    { key: 'ok', label: '🟢 Normal' },
];

type Props = NativeStackScreenProps<any, 'Stock'>;

export default function StockScreen({ navigation }: Props) {
    const products = useDataStore(s => s.products);
    const isLoading = useDataStore(s => s.isLoading);
    const loadProducts = useDataStore(s => s.loadProducts);
    const adjustStock = useDataStore(s => s.adjustStock);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();
    const user = useAppStore(s => s.user);
    const canEdit = user?.role === 'admin' || user?.role === 'operator';
    const isAdmin = user?.role === 'admin';

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [scanning, setScanning] = useState(false);

    const totalProducts = products.length;
    const critical = products.filter(p => getStatus(p.stock, p.minStock).level === 'critical').length;
    const low = products.filter(p => getStatus(p.stock, p.minStock).level === 'low').length;
    const ok = products.filter(p => getStatus(p.stock, p.minStock).level === 'ok').length;

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    }, []);

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
                    onPress: async () => {
                        await adjustStock(product.sku, delta);
                        await addLog({
                            level: delta > 0 ? 'success' : 'warning',
                            title: `Stok Düzeltme: ${product.name}`,
                            description: `${label}. Yeni stok: ${Math.max(0, product.stock + delta)} adet.`,
                            module: 'Stok',
                            entityId: product.id,
                            user: user?.name,
                        });
                        showToast({ message: `${product.name}: ${label}`, type: delta > 0 ? 'success' : 'info' });
                    }
                }
            ]
        );
    };

    return (
        <View style={s.root}>
            {/* Barkod Modal */}
            {scanning && (
                <BarcodeScanner
                    onClose={() => setScanning(false)}
                    onScan={(data) => {
                        setSearch(data);
                        setScanning(false);
                        showToast({ message: `Barkod tarandı: ${data}`, type: 'success' });
                    }}
                />
            )}

            {isAdmin && (
                <TouchableOpacity
                    style={s.fab}
                    onPress={() => navigation.navigate('CreateProduct')}
                    activeOpacity={0.85}
                >
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Özet Kartları */}
            <View style={s.summaryRow}>
                <SummaryChip icon="package-variant-closed" value={totalProducts} label="Toplam" color="#6C63FF" />
                <SummaryChip icon="alert-circle-outline" value={critical} label="Kritik" color="#E05C5C" />
                <SummaryChip icon="alert-outline" value={low} label="Düşük" color="#E8A020" />
                <SummaryChip icon="check-circle-outline" value={ok} label="Normal" color="#2A7A50" />
            </View>

            {/* Arama */}
            <View style={s.searchBox}>
                <Icon source="magnify" size={20} color="#AAA" />
                <TextInput style={s.searchInput} placeholder="Ürün adı veya SKU..." placeholderTextColor="#AAA"
                    value={search} onChangeText={setSearch} />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon source="close-circle" size={18} color="#AAA" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={s.scanBtn} onPress={() => setScanning(true)}>
                    <Icon source="barcode-scan" size={20} color={GREEN} />
                </TouchableOpacity>
            </View>

            {/* Filtreler */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {FILTERS.map(f => {
                    const active = filter === f.key;
                    return (
                        <FilterChip key={f.key} label={f.label} active={active} activeColor={GREEN} onPress={() => setFilter(f.key)} />
                    );
                })}
            </ScrollView>

            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} ürün</Text>
            )}

            {/* Liste */}
            <ScrollView
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
            >
                {isLoading ? (
                    <SkeletonList count={6} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="package-variant"
                        title="Ürün Bulunamadı"
                        description={search || filter !== 'all' ? "Arama veya filtreye uygun sonuç yok." : "Henüz hiç ürün kaydı bulunmuyor."}
                    />
                ) : (
                    filtered.map((product: Product) => {
                        const st = getStatus(product.stock, product.minStock);
                        const pct = Math.min(product.stock / Math.max(product.minStock, 1), 1);
                        return (
                            <StockCard
                                key={product.id}
                                product={product}
                                st={st}
                                pct={pct}
                                canEdit={canEdit}
                                onAdjust={handleAdjust}
                            />
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

/* ── Özet Chip ──────────────────────────────────────────── */
function SummaryChip({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
    return (
        <View style={[sc.wrap, { backgroundColor: color + '12' }]}>
            <Icon source={icon} size={16} color={color} />
            <Text style={[sc.val, { color }]}>{value}</Text>
            <Text style={sc.lbl}>{label}</Text>
        </View>
    );
}
const sc = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 10, gap: 3 },
    val: { fontSize: 16, fontWeight: '800' },
    lbl: { fontSize: 9.5, color: '#999', fontWeight: '600' },
});

/* ── Filter Chip ────────────────────────────────────────── */
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

/* ── Stok Kartı ─────────────────────────────────────────── */
function StockCard({ product, st, pct, canEdit, onAdjust }: {
    product: Product;
    st: { label: string; color: string; icon: string };
    pct: number;
    canEdit: boolean;
    onAdjust: (p: Product, d: number) => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
            {/* Üst */}
            <View style={s.cardTop}>
                <View style={[s.iconBox, { backgroundColor: st.color + '14' }]}>
                    <Icon source={st.icon} size={18} color={st.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.itemName} numberOfLines={1}>{product.name}</Text>
                    <Text style={s.itemSku}>{product.sku} · {product.unit}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: st.color + '18' }]}>
                    <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={s.barBg}>
                <View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: st.color }]} />
            </View>

            {/* Alt bilgi */}
            <View style={s.cardBottom}>
                <View>
                    <Text style={s.stockNum}>
                        <Text style={{ color: st.color, fontWeight: '800', fontSize: 18 }}>{product.stock}</Text>
                        <Text style={s.stockUnit}> {product.unit}</Text>
                    </Text>
                    <Text style={s.minText}>Min: {product.minStock} {product.unit}</Text>
                </View>
                {canEdit && (
                    <View style={s.adjustRow}>
                        <TouchableOpacity style={s.adjBtnNeg} onPress={() => onAdjust(product, -10)} activeOpacity={0.7}>
                            <Text style={s.adjBtnNegText}>−10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.adjBtnPos} onPress={() => onAdjust(product, 10)} activeOpacity={0.7}>
                            <Text style={s.adjBtnPosText}>+10</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
    scanBtn: { padding: 4, marginLeft: 2, borderLeftWidth: 1, borderLeftColor: '#EAEAEA', paddingLeft: 10 },
    filterBar: { maxHeight: 52, marginBottom: 4 },
    resultCount: { fontSize: 12, color: '#AAA', fontWeight: '600', paddingHorizontal: 16, marginBottom: 6 },
    list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },

    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 13.5, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 11, color: '#AAA', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },

    barBg: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stockNum: { fontSize: 13 },
    stockUnit: { fontSize: 12, color: '#AAA', fontWeight: '400' },
    minText: { fontSize: 11, color: '#BBB', marginTop: 2 },
    adjustRow: { flexDirection: 'row', gap: 6 },
    adjBtnNeg: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: '#E05C5C14', borderWidth: 1, borderColor: '#E05C5C35' },
    adjBtnNegText: { fontSize: 12, fontWeight: '800', color: '#E05C5C' },
    adjBtnPos: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: `${GREEN}12`, borderWidth: 1, borderColor: `${GREEN}35` },
    adjBtnPosText: { fontSize: 12, fontWeight: '800', color: GREEN },

    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 12, zIndex: 99 },
});
