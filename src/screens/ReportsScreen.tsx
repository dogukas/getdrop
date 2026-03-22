import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/useTheme';

const { width } = Dimensions.get('window');

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';
const ORANGE = '#E8A020';
const RED = '#E05C5C';
const BLUE = '#2196F3';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
    today: 'Bugün',
    week: 'Hafta',
    month: 'Ay',
    year: 'Yıl',
};

const PERIODS = Object.keys(PERIOD_LABELS) as Period[];

// ─── Yardımcı: Tarihe göre filtre ─────────────────────────────────────────────
function isInPeriod(dateStr: string, period: Period): boolean {
    const now = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    switch (period) {
        case 'today':
            return d.toDateString() === now.toDateString();
        case 'week': {
            const start = new Date(now); start.setDate(now.getDate() - 7);
            return d >= start;
        }
        case 'month': {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        case 'year':
            return d.getFullYear() === now.getFullYear();
    }
}

// ─── Bar Grafik ────────────────────────────────────────────────────────────────
// Custom Animasyonlu Bar Grafiğimiz (Önceki hali silinip yerine ChartKit eklendi, ancak özgün tasarımı korumak adına BarChart componenti iptal edilerek Line chart kullanıldı.)

// ─── Donut / Pasta benzeri yatay bar (durum dağılımı) ─────────────────────────
function DonutBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    return (
        <View style={db.wrap}>
            {/* Segmentli çubuk */}
            <View style={db.bar}>
                {segments.map((seg, i) => (
                    <View
                        key={seg.label}
                        style={[
                            db.seg,
                            {
                                flex: seg.value / total,
                                backgroundColor: seg.color,
                                borderTopLeftRadius: i === 0 ? 10 : 0,
                                borderBottomLeftRadius: i === 0 ? 10 : 0,
                                borderTopRightRadius: i === segments.length - 1 ? 10 : 0,
                                borderBottomRightRadius: i === segments.length - 1 ? 10 : 0,
                            },
                        ]}
                    />
                ))}
            </View>
            {/* Etiketler */}
            <View style={db.legend}>
                {segments.map(seg => (
                    <View key={seg.label} style={db.legendItem}>
                        <View style={[db.dot, { backgroundColor: seg.color }]} />
                        <Text style={db.legendLabel} numberOfLines={1}>{seg.label}</Text>
                        <Text style={[db.legendVal, { color: seg.color }]}>{seg.value}</Text>
                        <View style={db.pctBadge}>
                            <Text style={db.legendPct}>{total > 0 ? `${Math.round((seg.value / total) * 100)}%` : '0%'}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}
const db = StyleSheet.create({
    wrap: { gap: 18 },
    bar: { flexDirection: 'row', height: 16, borderRadius: 10, overflow: 'hidden', gap: 2 },
    seg: { height: '100%' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%', paddingVertical: 4 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { fontSize: 12, color: '#555', fontWeight: '600', flex: 1 },
    legendVal: { fontSize: 14, fontWeight: '800' },
    pctBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    legendPct: { fontSize: 9, color: '#888', fontWeight: '800' },
});

// ─── KPI Kart Yeni Tasarım ───────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend }: {
    icon: string; label: string; value: string | number; sub: string; color: string; trend: 'up' | 'down' | 'same';
}) {
    const theme = useTheme();
    const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
    const trendColor = trend === 'up' ? '#2A7A50' : trend === 'down' ? '#E05C5C' : '#888';

    return (
        <View style={[kc.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <View style={kc.topRow}>
                <View style={[kc.iconBox, { backgroundColor: `${color}15` }]}>
                    <Icon source={icon} size={18} color={color} />
                </View>
                <View style={[kc.trendBadge, { backgroundColor: `${trendColor}12` }]}>
                    <Icon source={trendIcon} size={12} color={trendColor} />
                </View>
            </View>
            <Text style={[kc.value, { color: theme.text }]}>{value}</Text>
            <Text style={[kc.label, { color: theme.textMuted }]}>{label}</Text>

            <View style={[kc.divider, { backgroundColor: theme.divider }]} />
            <Text style={[kc.sub, { color: theme.textMuted }]}>{sub}</Text>
            <View style={[kc.bottomLine, { backgroundColor: color }]} />
        </View>
    );
}
const kc = StyleSheet.create({
    card: { flex: 1, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 4, position: 'relative', overflow: 'hidden', borderWidth: 1 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trendBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    label: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    divider: { height: 1, marginVertical: 12 },
    sub: { fontSize: 11, fontWeight: '600' },
    bottomLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});

// ─── Animasyonlu Dönem Seçici ──────────────────────────────────────────────────
function AnimatedPeriodTabs({ current, onChange }: { current: Period; onChange: (p: Period) => void }) {
    const idx = PERIODS.indexOf(current);
    const tabWidth = (width - 32) / PERIODS.length; // 32 = margin horizontal

    const slideAnim = useRef(new Animated.Value(idx * tabWidth)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: idx * tabWidth,
            useNativeDriver: true,
            friction: 7,
            tension: 50
        }).start();
    }, [idx]);

    return (
        <View style={tab.wrap}>
            <Animated.View style={[tab.activeBg, { width: tabWidth - 8, transform: [{ translateX: slideAnim }] }]} />
            {PERIODS.map(p => (
                <TouchableOpacity key={p} style={tab.btn} onPress={() => onChange(p)} activeOpacity={0.7}>
                    <Text style={[tab.txt, current === p && tab.txtActive]}>{PERIOD_LABELS[p]}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
const tab = StyleSheet.create({
    wrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 4, position: 'relative' },
    activeBg: { position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: '#FFF', borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    btn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    txt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    txtActive: { color: GREEN },
});

// ─── Yatay İlerleme Satırı ─────────────────────────────────────────────────────
function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string; }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <View style={pr.row}>
            <Text style={pr.label} numberOfLines={1}>{label}</Text>
            <View style={pr.barBg}>
                <View style={[pr.bar, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[pr.pct, { color }]}>{value}</Text>
        </View>
    );
}
const pr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    label: { width: 140, fontSize: 12, color: '#333', fontWeight: '700' },
    barBg: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 4 },
    pct: { width: 34, fontSize: 13, fontWeight: '800', textAlign: 'right' },
});


// ─── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
    const theme = useTheme();
    const [period, setPeriod] = useState<Period>('month');

    const activeBranch = useAppStore(s => s.activeBranch);

    const { orders, transfers, shipments, products } = useDataStore(
        useShallow(s => ({
            orders: s.orders,
            transfers: s.transfers,
            shipments: s.shipments,
            products: s.products,
        }))
    );

    // ── Dönem filtreli veriler ──────────────────────────────────────────────────
    const filteredOrders = useMemo(() => orders.filter(o => isInPeriod(o.date, period)), [orders, period]);
    const filteredTransfers = useMemo(() => transfers.filter(t => isInPeriod(t.plannedDate, period)), [transfers, period]);
    const filteredShipments = useMemo(() => shipments.filter(s => isInPeriod(s.expectedDate, period)), [shipments, period]);

    // ── Sipariş KPI'ları ────────────────────────────────────────────────────────
    const oTotal = filteredOrders.length;
    const oPending = filteredOrders.filter(o => o.status === 'pending').length;
    const oProcessing = filteredOrders.filter(o => o.status === 'processing').length;
    const oCompleted = filteredOrders.filter(o => o.status === 'completed').length;
    const oCancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
    const oCompletePct = oTotal > 0 ? Math.round((oCompleted / oTotal) * 100) : 0;

    const orderRevenue = filteredOrders.reduce((sum, o) =>
        sum + o.items.reduce((s, i) => s + i.quantity * (i.unitPrice ?? 0), 0), 0
    );

    // ── Transfer KPI'ları ───────────────────────────────────────────────────────
    const tTotal = filteredTransfers.length;
    const tPending = filteredTransfers.filter(t => t.status === 'pending').length;
    const tTransit = filteredTransfers.filter(t => t.status === 'in_transit').length;
    const tDelivered = filteredTransfers.filter(t => t.status === 'delivered').length;
    const tRejected = filteredTransfers.filter(t => t.status === 'rejected').length;

    // ── Sevkiyat KPI'ları ───────────────────────────────────────────────────────
    const sTotal = filteredShipments.length;
    const sExpected = filteredShipments.filter(s => s.status === 'expected').length;
    const sAccepted = filteredShipments.filter(s => s.status === 'accepted').length;
    const sPartial = filteredShipments.filter(s => s.status === 'partial').length;
    const sRejected = filteredShipments.filter(s => s.status === 'rejected').length;
    const sAcceptPct = sTotal > 0 ? Math.round(((sAccepted + sPartial) / sTotal) * 100) : 0;

    // ── Stok analizi ────────────────────────────────────────────────────────────
    const criticalProducts = products.filter(p => p.stock < p.minStock * 0.5);
    const lowProducts = products.filter(p => p.stock >= p.minStock * 0.5 && p.stock < p.minStock);
    const okProducts = products.filter(p => p.stock >= p.minStock);
    const totalStock = products.reduce((s, p) => s + p.stock, 0);

    // ── Günlük sipariş akışı ───────────────────────────────────────
    const dailyOrderData = useMemo(() => {
        const days: { label: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            const count = orders.filter(o => {
                const od = new Date(o.date);
                return od.toDateString() === d.toDateString();
            }).length;
            days.push({ label, value: count });
        }
        return days;
    }, [orders]);

    // ── Ürün bazlı stok dağılımı ─────────────────────────────
    const topCritical = [...products]
        .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock))
        .slice(0, 6);

    const handleShare = () => {
        const summary =
            `📊 ${activeBranch?.name ?? 'Depo'} Raporu (${PERIOD_LABELS[period]})\n` +
            `Siparişler: ${oTotal} toplam, ${oCompleted} tamamlandı (%${oCompletePct})\n` +
            `Ciro: ₺${orderRevenue.toLocaleString('tr-TR')}\n` +
            `Transferler: ${tTotal} toplam, ${tDelivered} teslim\n` +
            `Sevkiyat Kabul: %${sAcceptPct} (${sTotal} beklenen)\n` +
            `Stok: ${criticalProducts.length} kritik, ${lowProducts.length} düşük, ${okProducts.length} normal`;
        Alert.alert('Rapor Özeti', summary, [
            { text: 'Kapat', style: 'cancel' },
            { text: '📋 Kopyala', onPress: () => { } },
        ]);
    };

    return (
        <ScrollView style={[s.root, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
            {/* Hero Header */}
            <View style={s.hero}>
                <View style={s.heroTitleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.heroTitle}>{activeBranch?.name ?? 'Depo'} Raporları</Text>
                        <Text style={s.heroSub}>Anlık operasyon ve finans özetiniz</Text>
                    </View>
                    <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                        <Icon source="share-variant-outline" size={18} color={GREEN} />
                        <Text style={s.shareBtnText}>Paylaş</Text>
                    </TouchableOpacity>
                </View>

                {/* Animated Dönem Seçici */}
                <AnimatedPeriodTabs current={period} onChange={setPeriod} />
            </View>

            <View style={s.content}>
                {/* ── Operasyon KPI Özeti ─────────────────────────────── */}
                <Text style={[s.section, { color: theme.text }]}>Operasyon Özeti</Text>
                <View style={s.kpiRow}>
                    <KpiCard
                        icon="clipboard-list-outline"
                        label="Toplam Sipariş"
                        value={oTotal}
                        sub={`${oCompletePct}% tamamlanma`}
                        color={GREEN}
                        trend={oCompletePct >= 50 ? 'up' : 'down'}
                    />
                    <KpiCard
                        icon="currency-try"
                        label="Sipariş Hacmi"
                        value={`₺${(orderRevenue / 1000).toFixed(0)}K`}
                        sub={`${oTotal} adet satış`}
                        color={BLUE}
                        trend="same"
                    />
                </View>
                <View style={[s.kpiRow, { marginTop: 12 }]}>
                    <KpiCard
                        icon="swap-horizontal-bold"
                        label="Transfer Çıkışı"
                        value={tTotal}
                        sub={`${tDelivered} teslim edildi`}
                        color={PURPLE}
                        trend={tDelivered > 0 ? 'up' : 'same'}
                    />
                    <KpiCard
                        icon="truck-check-outline"
                        label="Sevkiyat Kabul"
                        value={`${sAcceptPct}%`}
                        sub={`${sTotal} beklenen`}
                        color={ORANGE}
                        trend={sAcceptPct >= 70 ? 'up' : 'down'}
                    />
                </View>

                {/* ── Sipariş Durum Dağılımı ──────────────────────────── */}
                <Text style={[s.section, { marginTop: 24, color: theme.text }]}>Sipariş Dağılımı</Text>
                <View style={[s.chartCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                    {oTotal === 0 ? (
                        <Text style={s.empty}>Bu dönemde sipariş bulunmuyor</Text>
                    ) : (
                        <DonutBar segments={[
                            { label: 'Tamamlandı', value: oCompleted, color: GREEN },
                            { label: 'İşlemde', value: oProcessing, color: PURPLE },
                            { label: 'Bekleyen', value: oPending, color: ORANGE },
                            { label: 'İptal', value: oCancelled, color: RED },
                        ]} />
                    )}
                </View>

                {/* ── Günlük Sipariş Akışı (son 7 gün) ──────────────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Son 7 Gün Akışı</Text>
                <View style={s.chartCard}>
                    <LineChart
                        data={{
                            labels: dailyOrderData.map(d => d.label),
                            datasets: [{ data: dailyOrderData.map(d => d.value) }]
                        }}
                        width={width - 72} // Ekran genişliğinden paddingleri çıkar
                        height={180}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(42, 122, 80, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: GREEN
                            }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                    <View style={s.chartLegend}>
                        <View style={[s.legendDot, { backgroundColor: GREEN }]} />
                        <Text style={s.legendText}>Günlük yaratılan sipariş adedi</Text>
                    </View>
                </View>

                {/* ── Transfer Dağılımı ───────────────────────────────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Transfer Durumları</Text>
                <View style={s.chartCard}>
                    {tTotal === 0 ? (
                        <Text style={s.empty}>Bu dönemde transfer bulunmuyor</Text>
                    ) : (
                        <DonutBar segments={[
                            { label: 'Teslim', value: tDelivered, color: GREEN },
                            { label: 'Yolda', value: tTransit, color: PURPLE },
                            { label: 'Bekleyen', value: tPending, color: ORANGE },
                            { label: 'Reddedilen', value: tRejected, color: RED },
                        ]} />
                    )}
                </View>

                {/* ── Transfer & Sevkiyat Karşılaştırma BarChart ──────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Transfer & Sevkiyat Karşılaştırma</Text>
                <View style={s.chartCard}>
                    {(tTotal === 0 && sTotal === 0) ? (
                        <Text style={s.empty}>Bu dönemde veri bulunmuyor</Text>
                    ) : (
                        <>
                            <BarChart
                                data={{
                                    labels: ['Bekl.', 'Yolda', 'Teslim', 'Red'],
                                    datasets: [
                                        { data: [tPending, tTransit, tDelivered, tRejected], color: (o = 1) => `rgba(108,99,255,${o})` },
                                        { data: [sExpected, sPartial, sAccepted, sRejected], color: (o = 1) => `rgba(232,160,32,${o})` },
                                    ],
                                }}
                                width={width - 72}
                                height={180}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(42,122,80,${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                                    barPercentage: 0.55,
                                }}
                                style={{ marginVertical: 8, borderRadius: 12 }}
                                showValuesOnTopOfBars
                                fromZero
                            />
                            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                                <View style={s.chartLegend}>
                                    <View style={[s.legendDot, { backgroundColor: PURPLE }]} />
                                    <Text style={s.legendText}>Transfer</Text>
                                </View>
                                <View style={s.chartLegend}>
                                    <View style={[s.legendDot, { backgroundColor: ORANGE }]} />
                                    <Text style={s.legendText}>Sevkiyat</Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* ── Sevkiyat Kabul Özeti ────────────────────────────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Sevkiyat Kabulleri (Grafikli)</Text>
                <View style={s.chartCard}>
                    {sTotal === 0 ? (
                        <Text style={s.empty}>Bu dönemde sevkiyat bulunmuyor</Text>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <PieChart
                                data={[
                                    { name: 'Kabul', population: sAccepted, color: GREEN, legendFontColor: '#333', legendFontSize: 12 },
                                    { name: 'Kısmi', population: sPartial, color: PURPLE, legendFontColor: '#333', legendFontSize: 12 },
                                    { name: 'Bkl', population: sExpected, color: ORANGE, legendFontColor: '#333', legendFontSize: 12 },
                                    { name: 'Red', population: sRejected, color: RED, legendFontColor: '#333', legendFontSize: 12 },
                                ].filter(d => d.population > 0)}
                                width={width - 80}
                                height={160}
                                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[10, 0]}
                                absolute
                            />
                        </View>
                    )}
                </View>

                {/* ── Stok Sağlığı ───────────────────────────────────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Stok Sağlığı</Text>
                <View style={s.kpiRow}>
                    <KpiCard icon="check-circle-outline" label="Normal Stok" value={okProducts.length} sub="yeterli seviye var" color={GREEN} trend="up" />
                    <KpiCard icon="alert-outline" label="Düşük Stok" value={lowProducts.length} sub="azalan ürün sayısı" color={ORANGE} trend="down" />
                </View>
                <View style={[s.kpiRow, { marginTop: 12 }]}>
                    <KpiCard icon="alert-circle-outline" label="Kritik Stok" value={criticalProducts.length} sub="sipariş verilmesi lazım" color={RED} trend="down" />
                    <KpiCard icon="package-variant-closed" label="Toplam Satır" value={totalStock.toLocaleString('tr-TR')} sub="toplam adet ürün" color={BLUE} trend="same" />
                </View>

                {/* ── Kritik Ürün Listesi ─────────────────────────────── */}
                <Text style={[s.section, { marginTop: 24 }]}>Kritik Ürün Takibi</Text>
                <View style={[s.chartCard, { gap: 16 }]}>
                    {topCritical.length === 0 ? (
                        <Text style={s.empty}>Tüm ürünler hedef stokta 🎉</Text>
                    ) : (
                        topCritical.map(p => {
                            const pct = p.minStock > 0 ? Math.min(p.stock / p.minStock, 1) : 1;
                            const color = pct === 0 ? RED : pct < 0.5 ? RED : pct < 1 ? ORANGE : GREEN;
                            return (
                                <ProgressRow
                                    key={p.id}
                                    label={p.name}
                                    value={p.stock}
                                    total={p.minStock}
                                    color={color}
                                />
                            );
                        })
                    )}
                    <View style={s.stockNote}>
                        <Icon source="information-outline" size={14} color="#AAA" />
                        <Text style={s.stockNoteText}>Bar uzunluğu, minimum stok seviyesine göre orantılanmıştır.</Text>
                    </View>
                </View>

                <View style={{ height: 60 }} />
            </View>
        </ScrollView>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    hero: { backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: GREEN, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8, zIndex: 10 },
    heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
    heroIconWrap: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
    shareBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },

    content: { padding: 16, marginTop: -8 },

    section: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, marginLeft: 6, letterSpacing: -0.2 },
    kpiRow: { flexDirection: 'row', gap: 12 },

    chartCard: { borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3, borderWidth: 1 },
    chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#888', fontWeight: '500' },

    empty: { textAlign: 'center', color: '#AAA', fontSize: 14, paddingVertical: 24, fontWeight: '600' },

    stockNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#F9FAFF', padding: 10, borderRadius: 10 },
    stockNoteText: { fontSize: 11, color: '#888', fontWeight: '600', flex: 1 },
});
