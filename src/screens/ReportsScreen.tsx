import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    Animated, Dimensions, Alert,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { useTheme } from '../theme/useTheme';

const { width } = Dimensions.get('window');

const GREEN  = '#2A7A50';
const PURPLE = '#6C63FF';
const ORANGE = '#E8A020';
const RED    = '#E05C5C';
const BLUE   = '#2196F3';
const TEAL   = '#00BCD4';

type Period = 'today' | 'week' | 'month' | 'year';
const PERIOD_LABELS: Record<Period, string> = {
    today: 'Bugün', week: 'Hafta', month: 'Ay', year: 'Yıl',
};
const PERIODS = Object.keys(PERIOD_LABELS) as Period[];

function isInPeriod(dateStr: string, period: Period): boolean {
    const now = new Date();
    const d   = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    switch (period) {
        case 'today': return d.toDateString() === now.toDateString();
        case 'week':  { const s = new Date(now); s.setDate(now.getDate() - 7); return d >= s; }
        case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'year':  return d.getFullYear() === now.getFullYear();
    }
}

// ─── KPI Kartı ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend }: {
    icon: string; label: string; value: string | number;
    sub: string; color: string; trend: 'up' | 'down' | 'same';
}) {
    const theme = useTheme();
    const trendIcon  = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
    const trendColor = trend === 'up' ? GREEN : trend === 'down' ? RED : '#888';
    return (
        <View style={[kc.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <View style={kc.topRow}>
                <View style={[kc.iconBox, { backgroundColor: `${color}18` }]}>
                    <Icon source={icon} size={18} color={color} />
                </View>
                <View style={[kc.trendBadge, { backgroundColor: `${trendColor}18` }]}>
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
    card:      { flex: 1, borderRadius: 20, padding: 16, borderWidth: 1, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    topRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    iconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trendBadge:{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    value:     { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    label:     { fontSize: 12, fontWeight: '700', marginTop: 4 },
    divider:   { height: 1, marginVertical: 10 },
    sub:       { fontSize: 11, fontWeight: '600' },
    bottomLine:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});

// ─── Dönem Seçici ─────────────────────────────────────────────────────────────
function PeriodTabs({ current, onChange }: { current: Period; onChange: (p: Period) => void }) {
    const theme   = useTheme();
    const idx     = PERIODS.indexOf(current);
    const tabW    = (width - 32) / PERIODS.length;
    const slideAnim = useRef(new Animated.Value(idx * tabW)).current;
    useEffect(() => {
        Animated.spring(slideAnim, { toValue: idx * tabW, useNativeDriver: true, friction: 7, tension: 50 }).start();
    }, [idx]);
    return (
        <View style={[pt.wrap, { backgroundColor: theme.card }]}>
            <Animated.View style={[pt.indicator, { width: tabW - 8, backgroundColor: GREEN, transform: [{ translateX: slideAnim }] }]} />
            {PERIODS.map(p => (
                <TouchableOpacity key={p} style={pt.btn} onPress={() => onChange(p)} activeOpacity={0.7}>
                    <Text style={[pt.txt, { color: current === p ? '#fff' : theme.textMuted }]}>{PERIOD_LABELS[p]}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
const pt = StyleSheet.create({
    wrap:      { flexDirection: 'row', borderRadius: 14, padding: 4, position: 'relative', elevation: 2 },
    indicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 10 },
    btn:       { flex: 1, paddingVertical: 10, alignItems: 'center', zIndex: 1 },
    txt:       { fontSize: 13, fontWeight: '700' },
});

// ─── Chart Section Card ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const theme = useTheme();
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={[sc.title, { color: theme.text }]}>{title}</Text>
            <View style={[sc.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                {children}
            </View>
        </View>
    );
}
const sc = StyleSheet.create({
    title: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginLeft: 4, letterSpacing: -0.2 },
    card:  { borderRadius: 24, padding: 18, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
});

// ─── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
    const theme       = useTheme();
    const [period, setPeriod] = useState<Period>('month');
    const activeBranch = useAppStore(s => s.activeBranch);
    const { orders, transfers, shipments, products } = useDataStore(
        useShallow(s => ({ orders: s.orders, transfers: s.transfers, shipments: s.shipments, products: s.products }))
    );

    // ── Filtreli veriler ─────────────────────────────────────────────────────
    const fOrders    = useMemo(() => orders.filter(o => isInPeriod(o.date, period)), [orders, period]);
    const fTransfers = useMemo(() => transfers.filter(t => isInPeriod(t.plannedDate, period)), [transfers, period]);
    const fShipments = useMemo(() => shipments.filter(s => isInPeriod(s.expectedDate, period)), [shipments, period]);

    // ── KPI'lar ──────────────────────────────────────────────────────────────
    const oTotal     = fOrders.length;
    const oCompleted = fOrders.filter(o => o.status === 'completed').length;
    const oCancelled = fOrders.filter(o => o.status === 'cancelled').length;
    const oPending   = fOrders.filter(o => o.status === 'pending').length;
    const oProcessing= fOrders.filter(o => o.status === 'processing').length;
    const oCompletePct = oTotal > 0 ? Math.round((oCompleted / oTotal) * 100) : 0;
    const orderRevenue = fOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity * (i.unitPrice ?? 0), 0), 0);

    const tTotal     = fTransfers.length;
    const tDelivered = fTransfers.filter(t => t.status === 'delivered').length;
    const tPending   = fTransfers.filter(t => t.status === 'pending').length;
    const tTransit   = fTransfers.filter(t => t.status === 'in_transit').length;
    const tRejected  = fTransfers.filter(t => t.status === 'rejected').length;

    const sTotal     = fShipments.length;
    const sAccepted  = fShipments.filter(s => s.status === 'accepted').length;
    const sPartial   = fShipments.filter(s => s.status === 'partial').length;
    const sRejected  = fShipments.filter(s => s.status === 'rejected').length;
    const sExpected  = fShipments.filter(s => s.status === 'expected').length;
    const sAcceptPct = sTotal > 0 ? Math.round(((sAccepted + sPartial) / sTotal) * 100) : 0;

    const criticalProducts = products.filter(p => p.stock < p.minStock * 0.5).length;
    const lowProducts      = products.filter(p => p.stock >= p.minStock * 0.5 && p.stock < p.minStock).length;
    const okProducts       = products.filter(p => p.stock >= p.minStock).length;
    const totalStock       = products.reduce((s, p) => s + p.stock, 0);

    // ── Son 7 günlük sipariş line chart ──────────────────────────────────────
    const lineData = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const count = orders.filter(o => new Date(o.date).toDateString() === d.toDateString()).length;
            const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            return { value: count, label, dataPointText: String(count) };
        });
    }, [orders]);

    // ── Sipariş durum bar chart ───────────────────────────────────────────────
    const orderBarData = [
        { value: oPending,    label: 'Bekl.', frontColor: ORANGE, topLabelComponent: () => <Text style={{ fontSize: 9, color: ORANGE, fontWeight: '700' }}>{oPending}</Text> },
        { value: oProcessing, label: 'İşlem', frontColor: BLUE,   topLabelComponent: () => <Text style={{ fontSize: 9, color: BLUE,   fontWeight: '700' }}>{oProcessing}</Text> },
        { value: oCompleted,  label: 'Tamam', frontColor: GREEN,  topLabelComponent: () => <Text style={{ fontSize: 9, color: GREEN,  fontWeight: '700' }}>{oCompleted}</Text> },
        { value: oCancelled,  label: 'İptal', frontColor: RED,    topLabelComponent: () => <Text style={{ fontSize: 9, color: RED,    fontWeight: '700' }}>{oCancelled}</Text> },
    ];

    // ── Transfer durum pie chart ─────────────────────────────────────────────
    const transferPieData = [
        { value: tPending,   color: ORANGE, text: `${tPending}`,   label: 'Bekliyor' },
        { value: tTransit,   color: PURPLE, text: `${tTransit}`,   label: 'Aktarımda' },
        { value: tDelivered, color: GREEN,  text: `${tDelivered}`, label: 'Teslim' },
        { value: tRejected,  color: RED,    text: `${tRejected}`,  label: 'Reddedildi' },
    ].filter(d => d.value > 0);

    // ── Stok durum pie chart ─────────────────────────────────────────────────
    const stockPieData = [
        { value: okProducts,       color: GREEN,  text: `${okProducts}`,       label: 'Normal' },
        { value: lowProducts,      color: ORANGE, text: `${lowProducts}`,      label: 'Düşük' },
        { value: criticalProducts, color: RED,    text: `${criticalProducts}`, label: 'Kritik' },
    ].filter(d => d.value > 0);

    const isDark = theme.bg === '#0F1117' || theme.bg === '#111827';
    const chartTextColor = theme.textMuted;
    const rulesColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const handleShare = () => {
        Alert.alert('Rapor Özeti',
            `📊 ${activeBranch?.name ?? 'Depo'} (${PERIOD_LABELS[period]})\n` +
            `Siparişler: ${oTotal} toplam, ${oCompleted} tamamlandı (%${oCompletePct})\n` +
            `Ciro: ₺${orderRevenue.toLocaleString('tr-TR')}\n` +
            `Transferler: ${tTotal} toplam, ${tDelivered} teslim\n` +
            `Sevkiyat Kabul: %${sAcceptPct}\n` +
            `Stok: ${criticalProducts} kritik, ${lowProducts} düşük, ${okProducts} normal`,
            [{ text: 'Kapat', style: 'cancel' }]
        );
    };

    return (
        <ScrollView style={[s.root, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
            {/* Hero Header */}
            <View style={s.hero}>
                <View style={s.heroRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.heroTitle}>{activeBranch?.name ?? 'Depo'} Raporları</Text>
                        <Text style={s.heroSub}>Anlık operasyon ve finans özeti</Text>
                    </View>
                    <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                        <Icon source="share-variant-outline" size={16} color={GREEN} />
                        <Text style={s.shareTxt}>Paylaş</Text>
                    </TouchableOpacity>
                </View>
                <PeriodTabs current={period} onChange={setPeriod} />
            </View>

            <View style={s.content}>
                {/* ── Operasyon KPI'ları ──────────────────────────────────── */}
                <Text style={[s.sectionLabel, { color: theme.text }]}>Operasyon Özeti</Text>
                <View style={s.kpiRow}>
                    <KpiCard icon="clipboard-list-outline" label="Toplam Sipariş" value={oTotal}
                        sub={`%${oCompletePct} tamamlanma`} color={GREEN}
                        trend={oCompletePct >= 50 ? 'up' : 'down'} />
                    <KpiCard icon="currency-try" label="Sipariş Hacmi"
                        value={`₺${(orderRevenue / 1000).toFixed(0)}K`}
                        sub={`${oTotal} adet satış`} color={BLUE} trend="same" />
                </View>
                <View style={[s.kpiRow, { marginTop: 10 }]}>
                    <KpiCard icon="swap-horizontal-bold" label="Transfer" value={tTotal}
                        sub={`${tDelivered} teslim edildi`} color={PURPLE}
                        trend={tDelivered > 0 ? 'up' : 'same'} />
                    <KpiCard icon="truck-check-outline" label="Sevkiyat Kabul"
                        value={`%${sAcceptPct}`} sub={`${sTotal} beklenen`} color={ORANGE}
                        trend={sAcceptPct >= 70 ? 'up' : 'down'} />
                </View>

                {/* ── Son 7 Gün Sipariş Akışı (Line Chart) ─────────────── */}
                <Section title="📈 Son 7 Gün Sipariş Akışı">
                    {orders.length === 0 ? (
                        <Text style={[s.empty, { color: theme.textMuted }]}>Henüz sipariş verisi yok</Text>
                    ) : (
                        <LineChart
                            data={lineData}
                            width={width - 80}
                            height={180}
                            color={GREEN}
                            thickness={2.5}
                            startFillColor={`${GREEN}80`}
                            endFillColor={`${GREEN}00`}
                            areaChart
                            curved
                            hideDataPoints={false}
                            dataPointsColor={GREEN}
                            dataPointsRadius={5}
                            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 9 }}
                            rulesColor={rulesColor}
                            yAxisColor="transparent"
                            xAxisColor={rulesColor}
                            noOfSections={4}
                            maxValue={Math.max(...lineData.map(d => d.value), 4)}
                            showVerticalLines
                            verticalLinesColor={rulesColor}
                        />
                    )}
                </Section>

                {/* ── Sipariş Durum Dağılımı (Bar Chart) ───────────────── */}
                <Section title="📊 Sipariş Durum Dağılımı">
                    {oTotal === 0 ? (
                        <Text style={[s.empty, { color: theme.textMuted }]}>Bu dönemde sipariş bulunmuyor</Text>
                    ) : (
                        <>
                            <BarChart
                                data={orderBarData}
                                width={width - 80}
                                height={160}
                                barWidth={42}
                                spacing={18}
                                roundedTop
                                hideRules={false}
                                rulesColor={rulesColor}
                                yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
                                yAxisColor="transparent"
                                xAxisColor={rulesColor}
                                noOfSections={4}
                                maxValue={Math.max(oPending, oProcessing, oCompleted, oCancelled, 4)}
                                barBorderRadius={6}
                                topLabelTextStyle={{ fontSize: 9, fontWeight: '700' }}
                                isAnimated
                            />
                            {/* Legend */}
                            <View style={s.legend}>
                                {[
                                    { color: ORANGE, label: `Bekliyor (${oPending})` },
                                    { color: BLUE,   label: `İşlemde (${oProcessing})` },
                                    { color: GREEN,  label: `Tamamlandı (${oCompleted})` },
                                    { color: RED,    label: `İptal (${oCancelled})` },
                                ].map(l => (
                                    <View key={l.label} style={s.legendItem}>
                                        <View style={[s.legendDot, { backgroundColor: l.color }]} />
                                        <Text style={[s.legendTxt, { color: theme.textMuted }]}>{l.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </Section>

                {/* ── Transfer Dağılımı (Pie Chart) ─────────────────────── */}
                <Section title="🔄 Transfer Durumu">
                    {tTotal === 0 ? (
                        <Text style={[s.empty, { color: theme.textMuted }]}>Bu dönemde transfer yok</Text>
                    ) : (
                        <View style={s.pieRow}>
                            <PieChart
                                data={transferPieData}
                                donut
                                radius={80}
                                innerRadius={52}
                                innerCircleColor={theme.card}
                                centerLabelComponent={() => (
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text }}>{tTotal}</Text>
                                        <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '600' }}>toplam</Text>
                                    </View>
                                )}
                                isAnimated
                                animationDuration={800}
                                showText={false}
                            />
                            <View style={s.pieLegend}>
                                {[
                                    { color: ORANGE, label: 'Bekliyor', val: tPending },
                                    { color: PURPLE, label: 'Aktarımda', val: tTransit },
                                    { color: GREEN,  label: 'Teslim', val: tDelivered },
                                    { color: RED,    label: 'Reddedildi', val: tRejected },
                                ].map(l => (
                                    <View key={l.label} style={s.pieLegendItem}>
                                        <View style={[s.legendDot, { backgroundColor: l.color }]} />
                                        <Text style={[s.legendTxt, { color: theme.textMuted, flex: 1 }]}>{l.label}</Text>
                                        <Text style={[s.legendVal, { color: l.color }]}>{l.val}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </Section>

                {/* ── Sevkiyat Özeti (Bar Chart) ────────────────────────── */}
                <Section title="🚢 Sevkiyat Durumu">
                    {sTotal === 0 ? (
                        <Text style={[s.empty, { color: theme.textMuted }]}>Bu dönemde sevkiyat yok</Text>
                    ) : (
                        <>
                            <BarChart
                                data={[
                                    { value: sExpected,  label: 'Beklenen', frontColor: BLUE,   barBorderRadius: 6 },
                                    { value: sAccepted,  label: 'Kabul',    frontColor: GREEN,  barBorderRadius: 6 },
                                    { value: sPartial,   label: 'Kısmi',    frontColor: ORANGE, barBorderRadius: 6 },
                                    { value: sRejected,  label: 'Reddedildi', frontColor: RED,  barBorderRadius: 6 },
                                ]}
                                width={width - 80}
                                height={150}
                                barWidth={46}
                                spacing={16}
                                roundedTop
                                rulesColor={rulesColor}
                                yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 9 }}
                                yAxisColor="transparent"
                                xAxisColor={rulesColor}
                                noOfSections={4}
                                maxValue={Math.max(sExpected, sAccepted, sPartial, sRejected, 4)}
                                isAnimated
                            />
                            <View style={[s.statRow, { marginTop: 12 }]}>
                                <View style={[s.statChip, { backgroundColor: `${GREEN}18` }]}>
                                    <Text style={[s.statVal, { color: GREEN }]}>%{sAcceptPct}</Text>
                                    <Text style={[s.statLbl, { color: GREEN }]}>kabul oranı</Text>
                                </View>
                                <View style={[s.statChip, { backgroundColor: `${BLUE}18` }]}>
                                    <Text style={[s.statVal, { color: BLUE }]}>{sTotal}</Text>
                                    <Text style={[s.statLbl, { color: BLUE }]}>toplam beklenen</Text>
                                </View>
                            </View>
                        </>
                    )}
                </Section>

                {/* ── Stok Analizi (Pie + KPI) ──────────────────────────── */}
                <Section title="📦 Stok Analizi">
                    {products.length === 0 ? (
                        <Text style={[s.empty, { color: theme.textMuted }]}>Stok verisi yok</Text>
                    ) : (
                        <>
                            <View style={s.pieRow}>
                                <PieChart
                                    data={stockPieData.length > 0 ? stockPieData : [{ value: 1, color: '#eee', text: '' }]}
                                    donut
                                    radius={75}
                                    innerRadius={48}
                                    innerCircleColor={theme.card}
                                    centerLabelComponent={() => (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }}>{products.length}</Text>
                                            <Text style={{ fontSize: 9, color: theme.textMuted, fontWeight: '600' }}>ürün</Text>
                                        </View>
                                    )}
                                    isAnimated
                                    animationDuration={800}
                                />
                                <View style={s.pieLegend}>
                                    {[
                                        { color: GREEN,  label: 'Normal stok',  val: okProducts },
                                        { color: ORANGE, label: 'Düşük stok',   val: lowProducts },
                                        { color: RED,    label: 'Kritik stok',  val: criticalProducts },
                                    ].map(l => (
                                        <View key={l.label} style={s.pieLegendItem}>
                                            <View style={[s.legendDot, { backgroundColor: l.color }]} />
                                            <Text style={[s.legendTxt, { color: theme.textMuted, flex: 1 }]}>{l.label}</Text>
                                            <Text style={[s.legendVal, { color: l.color }]}>{l.val}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={[s.statRow, { marginTop: 16 }]}>
                                <View style={[s.statChip, { backgroundColor: `${RED}18`, flex: 1 }]}>
                                    <Text style={[s.statVal, { color: RED }]}>{criticalProducts}</Text>
                                    <Text style={[s.statLbl, { color: RED }]}>kritik ürün</Text>
                                </View>
                                <View style={[s.statChip, { backgroundColor: `${BLUE}18`, flex: 1 }]}>
                                    <Text style={[s.statVal, { color: BLUE }]}>{totalStock.toLocaleString('tr-TR')}</Text>
                                    <Text style={[s.statLbl, { color: BLUE }]}>toplam adet</Text>
                                </View>
                            </View>
                        </>
                    )}
                </Section>

                <View style={{ height: 60 }} />
            </View>
        </ScrollView>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root:         { flex: 1 },
    hero:         { backgroundColor: GREEN, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 14 },
    heroRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    heroTitle:    { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
    heroSub:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
    shareBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
    shareTxt:     { fontSize: 12, fontWeight: '700', color: GREEN },
    content:      { padding: 16, marginTop: -6 },
    sectionLabel: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginLeft: 2, letterSpacing: -0.2 },
    kpiRow:       { flexDirection: 'row', gap: 10 },
    empty:        { textAlign: 'center', fontSize: 13, paddingVertical: 20, fontWeight: '600' },
    legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot:    { width: 8, height: 8, borderRadius: 4 },
    legendTxt:    { fontSize: 11, fontWeight: '600' },
    legendVal:    { fontSize: 13, fontWeight: '800', minWidth: 24, textAlign: 'right' },
    pieRow:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
    pieLegend:    { flex: 1, gap: 10 },
    pieLegendItem:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
    statRow:      { flexDirection: 'row', gap: 10 },
    statChip:     { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
    statVal:      { fontSize: 20, fontWeight: '900' },
    statLbl:      { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
