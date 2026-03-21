import React, { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, Animated, FlatList, Modal } from 'react-native';
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
import { useDebounce } from '../hooks/useDebounce';
import * as Haptics from 'expo-haptics';

const GREEN = '#2A7A50';
const RED = '#E05C5C';
const ORANGE = '#E8A020';

type Filter = 'all' | 'critical' | 'low' | 'ok';

function getStatus(stock: number, minStock: number): { label: string; color: string; level: Filter; icon: string } {
    if (stock === 0) return { label: 'Tükendi', color: RED, level: 'critical', icon: 'close-circle-outline' };
    if (stock < minStock * 0.5) return { label: 'Kritik', color: RED, level: 'critical', icon: 'alert-circle-outline' };
    if (stock < minStock) return { label: 'Düşük', color: ORANGE, level: 'low', icon: 'alert-outline' };
    return { label: 'Normal', color: GREEN, level: 'ok', icon: 'check-circle-outline' };
}

/** AI tahminleme: günlük tüketim hızı varsayımı — minStock'u 30 günde tüketir */
function daysUntilEmpty(stock: number, minStock: number): number | null {
    if (minStock <= 0 || stock <= 0) return null;
    const dailyRate = minStock / 30;
    if (dailyRate <= 0) return null;
    return Math.round(stock / dailyRate);
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
    const debouncedSearch = useDebounce(search, 300);
    const [filter, setFilter] = useState<Filter>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [customQtyProduct, setCustomQtyProduct] = useState<Product | null>(null);
    const [customQtyValue, setCustomQtyValue] = useState('');
    const [customQtyMode, setCustomQtyMode] = useState<'add' | 'sub'>('add');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const totalProducts = products.length;
    const critical = products.filter(p => getStatus(p.stock, p.minStock).level === 'critical').length;
    const low = products.filter(p => getStatus(p.stock, p.minStock).level === 'low').length;
    const ok = products.filter(p => getStatus(p.stock, p.minStock).level === 'ok').length;

    // Kritik stok uyarısı — sayfa açıldığında
    useEffect(() => {
        const criticalItems = products.filter(p => getStatus(p.stock, p.minStock).level === 'critical');
        if (criticalItems.length > 0) {
            const names = criticalItems.slice(0, 3).map(p => p.name).join(', ');
            const extra = criticalItems.length > 3 ? ` +${criticalItems.length - 3} daha` : '';
            setTimeout(() => {
                showToast({
                    message: `⚠️ Kritik stok: ${names}${extra}`,
                    type: 'error',
                });
            }, 800);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    }, []);

    const filtered = useMemo(() => {
        const base = products.filter((p: Product) => {
            const st = getStatus(p.stock, p.minStock);
            const matchF = filter === 'all' || st.level === filter;
            const matchS = p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                || p.sku.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchF && matchS;
        });
        // Urgency: critical first, then low, then ok
        return [...base].sort((a, b) => {
            const rank = (p: Product) => {
                const l = getStatus(p.stock, p.minStock).level;
                return l === 'critical' ? 0 : l === 'low' ? 1 : 2;
            };
            return rank(a) - rank(b);
        });
    }, [products, filter, debouncedSearch]);

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
                    text: 'Onayla', onPress: async () => {
                        await adjustStock(product.sku, delta);
                        Haptics.notificationAsync(delta > 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
                        await addLog({
                            level: delta > 0 ? 'success' : 'warning',
                            title: `Stok Düzeltme: ${product.name}`,
                            description: `${label}. Yeni stok: ${Math.max(0, product.stock + delta)} adet.`,
                            module: 'Stok', entityId: product.id, user: user?.name,
                        });
                        showToast({ message: `${product.name}: ${label}`, type: delta > 0 ? 'success' : 'info' });
                    }
                }
            ]
        );
    };

    const handleCustomQty = async () => {
        if (!customQtyProduct) return;
        const qty = parseInt(customQtyValue);
        if (isNaN(qty) || qty <= 0) {
            showToast({ message: 'Geçerli bir miktar girin.', type: 'error' });
            return;
        }
        const delta = customQtyMode === 'add' ? qty : -qty;
        setCustomQtyProduct(null);
        setCustomQtyValue('');
        await handleAdjust(customQtyProduct, delta);
    };

    // Barkod → ürüne scroll & highlight
    const handleBarcodeScan = (data: string) => {
        setSearch(data);
        setScanning(false);
        showToast({ message: `Barkod tarandı: ${data}`, type: 'success' });

        // Bulunan ürünü bul ve highlight et
        const found = products.find(p => p.sku === data || p.name.toLowerCase().includes(data.toLowerCase()));
        if (found) {
            setHighlightedId(found.id);
            setTimeout(() => {
                const idx = filtered.findIndex(p => p.id === found.id);
                if (idx >= 0) flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
            }, 300);
            setTimeout(() => setHighlightedId(null), 2500);
        }
    };

    return (
        <View style={s.root}>
            {/* Barkod Modal */}
            {scanning && (
                <BarcodeScanner onClose={() => setScanning(false)} onScan={handleBarcodeScan} />
            )}

            {/* Özel Miktar Modal */}
            <Modal visible={!!customQtyProduct} transparent animationType="fade" onRequestClose={() => setCustomQtyProduct(null)}>
                <View style={cq.overlay}>
                    <View style={cq.modal}>
                        <Text style={cq.title}>{customQtyProduct?.name}</Text>
                        <Text style={cq.sub}>Mevcut stok: {customQtyProduct?.stock} {customQtyProduct?.unit}</Text>

                        <View style={cq.modeRow}>
                            <TouchableOpacity
                                style={[cq.modeBtn, customQtyMode === 'add' && { backgroundColor: GREEN }]}
                                onPress={() => setCustomQtyMode('add')}
                            >
                                <Text style={[cq.modeTxt, customQtyMode === 'add' && { color: '#FFF' }]}>+ Ekle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[cq.modeBtn, customQtyMode === 'sub' && { backgroundColor: RED }]}
                                onPress={() => setCustomQtyMode('sub')}
                            >
                                <Text style={[cq.modeTxt, customQtyMode === 'sub' && { color: '#FFF' }]}>− Düş</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={cq.input}
                            value={customQtyValue}
                            onChangeText={setCustomQtyValue}
                            keyboardType="numeric"
                            placeholder="Miktar girin..."
                            placeholderTextColor="#BBB"
                            autoFocus
                        />

                        <View style={cq.btnRow}>
                            <TouchableOpacity style={cq.cancelBtn} onPress={() => setCustomQtyProduct(null)}>
                                <Text style={cq.cancelTxt}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[cq.confirmBtn, { backgroundColor: customQtyMode === 'add' ? GREEN : RED }]}
                                onPress={handleCustomQty}
                            >
                                <Text style={cq.confirmTxt}>Onayla</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {isAdmin && (
                <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateProduct')} activeOpacity={0.85}>
                    <Icon source="plus" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Özet Kartları */}
            <View style={s.summaryRow}>
                <SummaryChip icon="package-variant-closed" value={totalProducts} label="Toplam" color="#6C63FF" />
                <SummaryChip icon="alert-circle-outline" value={critical} label="Kritik" color={RED} />
                <SummaryChip icon="alert-outline" value={low} label="Düşük" color={ORANGE} />
                <SummaryChip icon="check-circle-outline" value={ok} label="Normal" color={GREEN} />
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
                        <FilterChip key={f.key} label={f.label} active={active} activeColor={GREEN} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setFilter(f.key);
                        }} />
                    );
                })}
            </ScrollView>

            {!isLoading && (
                <Text style={s.resultCount}>{filtered.length} ürün</Text>
            )}

            {/* Liste */}
            <FlatList
                ref={flatListRef}
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[s.list, filtered.length === 0 && { flexGrow: 1 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={10}
                onScrollToIndexFailed={() => { }}
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={6} />
                    ) : (
                        <EmptyState
                            icon="package-variant"
                            title="Ürün Bulunamadı"
                            description={search || filter !== 'all' ? "Arama veya filtreye uygun sonuç yok." : "Henüz hiç ürün kaydı bulunmuyor."}
                        />
                    )
                }
                renderItem={({ item: product }) => {
                    const st = getStatus(product.stock, product.minStock);
                    const pct = Math.min(product.stock / Math.max(product.minStock, 1), 1);
                    const days = daysUntilEmpty(product.stock, product.minStock);
                    const isHighlighted = highlightedId === product.id;
                    return (
                        <MemoStockCard
                            product={product}
                            st={st}
                            pct={pct}
                            daysLeft={days}
                            canEdit={canEdit}
                            isHighlighted={isHighlighted}
                            onAdjust={(p: Product, d: number) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                handleAdjust(p, d);
                            }}
                            onCustomQty={(p: Product) => {
                                setCustomQtyProduct(p);
                                setCustomQtyMode('add');
                                setCustomQtyValue('');
                            }}
                        />
                    );
                }}
            />
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
function StockCard({ product, st, pct, daysLeft, canEdit, isHighlighted, onAdjust, onCustomQty }: {
    product: Product;
    st: { label: string; color: string; icon: string };
    pct: number;
    daysLeft: number | null;
    canEdit: boolean;
    isHighlighted: boolean;
    onAdjust: (p: Product, d: number) => void;
    onCustomQty: (p: Product) => void;
}) {
    const highlightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isHighlighted) {
            Animated.sequence([
                Animated.timing(highlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
            ]).start();
        }
    }, [isHighlighted]);

    const highlightBg = highlightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FFFFFF', '#2A7A5015'],
    });

    return (
        <Animated.View style={[s.card, { backgroundColor: highlightBg }]}>
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
                    {/* AI Tahmin */}
                    {daysLeft !== null && (
                        <View style={[s.aiBadge, { backgroundColor: daysLeft < 7 ? '#E05C5C15' : daysLeft < 14 ? '#E8A02015' : '#2A7A5015' }]}>
                            <Icon source="robot-outline" size={10} color={daysLeft < 7 ? RED : daysLeft < 14 ? ORANGE : GREEN} />
                            <Text style={[s.aiText, { color: daysLeft < 7 ? RED : daysLeft < 14 ? ORANGE : GREEN }]}>
                                ~{daysLeft} gün
                            </Text>
                        </View>
                    )}
                </View>
                {canEdit && (
                    <View style={s.adjustRow}>
                        <TouchableOpacity style={s.adjBtnNeg} onPress={() => onAdjust(product, -10)} activeOpacity={0.7}>
                            <Text style={s.adjBtnNegText}>−10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.adjBtnPos} onPress={() => onAdjust(product, 10)} activeOpacity={0.7}>
                            <Text style={s.adjBtnPosText}>+10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.adjBtnCustom} onPress={() => onCustomQty(product)} activeOpacity={0.7}>
                            <Icon source="pencil-outline" size={14} color="#6C63FF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const MemoStockCard = memo(StockCard, (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.stock === next.product.stock &&
    prev.canEdit === next.canEdit &&
    prev.isHighlighted === next.isHighlighted
);

/* ── Custom Qty Modal Styles ────────────────────────────── */
const cq = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '85%', maxWidth: 340, gap: 14 },
    title: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    sub: { fontSize: 12, color: '#888' },
    modeRow: { flexDirection: 'row', gap: 10 },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F4F6F8', alignItems: 'center' },
    modeTxt: { fontSize: 14, fontWeight: '700', color: '#666' },
    input: { backgroundColor: '#F4F6F8', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
    btnRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F4F6F8', alignItems: 'center' },
    cancelTxt: { fontSize: 14, fontWeight: '700', color: '#888' },
    confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    confirmTxt: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});

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

    card: { borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 13.5, fontWeight: '700', color: '#1A1A1A' },
    itemSku: { fontSize: 11, color: '#AAA', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },

    barBg: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    stockNum: { fontSize: 13 },
    stockUnit: { fontSize: 12, color: '#AAA', fontWeight: '400' },
    minText: { fontSize: 11, color: '#BBB', marginTop: 2 },
    aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginTop: 5, alignSelf: 'flex-start' },
    aiText: { fontSize: 10, fontWeight: '700' },

    adjustRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    adjBtnNeg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#E05C5C14', borderWidth: 1, borderColor: '#E05C5C35' },
    adjBtnNegText: { fontSize: 12, fontWeight: '800', color: RED },
    adjBtnPos: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: `${GREEN}12`, borderWidth: 1, borderColor: `${GREEN}35` },
    adjBtnPosText: { fontSize: 12, fontWeight: '800', color: GREEN },
    adjBtnCustom: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#6C63FF12', borderWidth: 1, borderColor: '#6C63FF30', alignItems: 'center', justifyContent: 'center' },

    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 12, zIndex: 99 },
});
