import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';
const ORANGE = '#E8A020';
const RED = '#E05C5C';
const BLUE = '#2196F3';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
};

// ─── Yardımcı: Tarihe göre filtre ─────────────────────────────────────────────
function isInPeriod(dateStr: string, period: Period): boolean {
    const now = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true; // parse edilemezse dahil et
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
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={bc.wrap}>
            {data.map(d => (
                <View key={d.label} style={bc.col}>
                    <Text style={bc.val}>{d.value}</Text>
                    <View style={bc.barBg}>
                        <View style={[bc.bar, { height: `${(d.value / max) * 100}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={bc.lbl}>{d.label}</Text>
                </View>
            ))}
        </View>
    );
}
const bc = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6, paddingTop: 8 },
    col: { flex: 1, alignItems: 'center', gap: 3 },
    barBg: { width: '100%', height: 90, borderRadius: 6, backgroundColor: '#F0F0F0', justifyContent: 'flex-end', overflow: 'hidden' },
    bar: { width: '100%', borderRadius: 6 },
    lbl: { fontSize: 9, color: '#888', fontWeight: '600' },
    val: { fontSize: 10, color: '#333', fontWeight: '800' },
});

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
                                borderTopLeftRadius: i === 0 ? 8 : 0,
                                borderBottomLeftRadius: i === 0 ? 8 : 0,
                                borderTopRightRadius: i === segments.length - 1 ? 8 : 0,
                                borderBottomRightRadius: i === segments.length - 1 ? 8 : 0,
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
                        <Text style={db.legendLabel}>{seg.label}</Text>
                        <Text style={[db.legendVal, { color: seg.color }]}>{seg.value}</Text>
                        <Text style={db.legendPct}>
                            {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : '0%'}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
const db = StyleSheet.create({
    wrap: { gap: 14 },
    bar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', gap: 1 },
    seg: { height: '100%' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 120 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 11, color: '#555', flex: 1 },
    legendVal: { fontSize: 12, fontWeight: '800' },
    legendPct: { fontSize: 10, color: '#AAA', width: 30, textAlign: 'right' },
});

// ─── KPI Kart ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend }: {
    icon: string; label: string; value: string | number; sub: string; color: string; trend: 'up' | 'down' | 'same';
}) {
    const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
    const trendColor = trend === 'up' ? '#2A7A50' : trend === 'down' ? '#E05C5C' : '#888';
    return (
        <View style={[kc.card, { borderTopColor: color }]}>
            <View style={[kc.iconBox, { backgroundColor: `${color}15` }]}>
                <Icon source={icon} size={20} color={color} />
            </View>
            <Text style={kc.label}>{label}</Text>
            <Text style={kc.value}>{value}</Text>
            <View style={kc.trendRow}>
                <Icon source={trendIcon} size={12} color={trendColor} />
                <Text style={[kc.sub, { color: trendColor }]}>{sub}</Text>
            </View>
        </View>
    );
}
const kc = StyleSheet.create({
    card: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    label: { fontSize: 10, color: '#888', fontWeight: '600' },
    value: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    sub: { fontSize: 10 },
});

// ─── Yatay ilerleme satırı ─────────────────────────────────────────────────────
function ProgressRow({ label, value, total, color }: {
    label: string; value: number; total: number; color: string;
}) {
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    label: { width: 130, fontSize: 11, color: '#555', fontWeight: '600' },
    barBg: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 4 },
    pct: { width: 24, fontSize: 12, fontWeight: '800', textAlign: 'right' },
});

// ─── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
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

    // Toplam sipariş tutarı
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

    // ── Günlük sipariş akışı (son 7 gün) ───────────────────────────────────────
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

    // ── Ürün bazlı stok dağılımı (en düşük 6 ürün) ─────────────────────────────
    const topCritical = [...products]
        .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock))
        .slice(0, 6);

    return (
        <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

            {/* Başlık */}
            <View style={s.branchHeader}>
                <Icon source="domain" size={24} color={GREEN} />
                <Text style={s.branchHeaderText}>{activeBranch?.name ?? 'Depo'} Raporları</Text>
            </View>

            {/* Dönem Seçici */}
            <View style={s.periodRow}>
                {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setPeriod(p)}
                        style={[s.periodChip, period === p && { backgroundColor: GREEN }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.periodText, period === p && { color: 'white' }]}>
                            {PERIOD_LABELS[p]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Operasyon KPI Özeti ─────────────────────────────── */}
            <Text style={s.section}>📊 Operasyon Özeti</Text>
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
                    label="Sipariş Tutarı"
                    value={`₺${(orderRevenue / 1000).toFixed(0)}K`}
                    sub={`${oTotal} sipariş`}
                    color={BLUE}
                    trend="same"
                />
            </View>
            <View style={[s.kpiRow, { marginTop: 10 }]}>
                <KpiCard
                    icon="swap-horizontal-bold"
                    label="Transfer"
                    value={tTotal}
                    sub={`${tDelivered} teslim edildi`}
                    color={PURPLE}
                    trend={tDelivered > 0 ? 'up' : 'same'}
                />
                <KpiCard
                    icon="truck-check-outline"
                    label="Sevkiyat Kabul"
                    value={`${sAcceptPct}%`}
                    sub={`${sTotal} sevkiyat`}
                    color={ORANGE}
                    trend={sAcceptPct >= 70 ? 'up' : 'down'}
                />
            </View>

            {/* ── Sipariş Durum Dağılımı ──────────────────────────── */}
            <Text style={[s.section, { marginTop: 20 }]}>📦 Sipariş Durum Dağılımı</Text>
            <View style={s.chartCard}>
                {oTotal === 0 ? (
                    <Text style={s.empty}>Bu dönemde sipariş yok</Text>
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
            <Text style={[s.section, { marginTop: 16 }]}>📈 Son 7 Gün — Sipariş Akışı</Text>
            <View style={s.chartCard}>
                <BarChart color={GREEN} data={dailyOrderData} />
                <View style={s.chartLegend}>
                    <View style={[s.legendDot, { backgroundColor: GREEN }]} />
                    <Text style={s.legendText}>Günlük sipariş sayısı (tüm dönem)</Text>
                </View>
            </View>

            {/* ── Transfer Dağılımı ───────────────────────────────── */}
            <Text style={[s.section, { marginTop: 16 }]}>🔄 Transfer Durum Dağılımı</Text>
            <View style={s.chartCard}>
                {tTotal === 0 ? (
                    <Text style={s.empty}>Bu dönemde transfer yok</Text>
                ) : (
                    <DonutBar segments={[
                        { label: 'Teslim', value: tDelivered, color: GREEN },
                        { label: 'Aktarımda', value: tTransit, color: PURPLE },
                        { label: 'Bekliyor', value: tPending, color: ORANGE },
                        { label: 'Reddedildi', value: tRejected, color: RED },
                    ]} />
                )}
            </View>

            {/* ── Sevkiyat Kabul Özeti ────────────────────────────── */}
            <Text style={[s.section, { marginTop: 16 }]}>🚚 Sevkiyat Kabul Durumu</Text>
            <View style={s.chartCard}>
                {sTotal === 0 ? (
                    <Text style={s.empty}>Bu dönemde sevkiyat yok</Text>
                ) : (
                    <DonutBar segments={[
                        { label: 'Kabul', value: sAccepted, color: GREEN },
                        { label: 'Kısmi Kabul', value: sPartial, color: PURPLE },
                        { label: 'Bekleniyor', value: sExpected, color: ORANGE },
                        { label: 'Reddedildi', value: sRejected, color: RED },
                    ]} />
                )}
            </View>

            {/* ── Stok Sağlığı ───────────────────────────────────── */}
            <Text style={[s.section, { marginTop: 16 }]}>📦 Stok Sağlığı Genel Bakış</Text>
            <View style={s.kpiRow}>
                <KpiCard icon="check-circle-outline" label="Normal Stok" value={okProducts.length} sub="yeterli seviye" color={GREEN} trend="up" />
                <KpiCard icon="alert-outline" label="Düşük Stok" value={lowProducts.length} sub="dikkat gerektiriyor" color={ORANGE} trend="down" />
            </View>
            <View style={[s.kpiRow, { marginTop: 10 }]}>
                <KpiCard icon="alert-circle-outline" label="Kritik Stok" value={criticalProducts.length} sub="acil müdahale gerekli" color={RED} trend="down" />
                <KpiCard icon="package-variant-closed" label="Toplam Stok" value={totalStock.toLocaleString('tr-TR')} sub="tüm ürünler" color={BLUE} trend="same" />
            </View>

            {/* ── Kritik Ürün Listesi ─────────────────────────────── */}
            <Text style={[s.section, { marginTop: 16 }]}>⚠️ Stok Kritiklik Sıralaması</Text>
            <View style={[s.chartCard, { gap: 12 }]}>
                {topCritical.length === 0 ? (
                    <Text style={s.empty}>Tüm ürünler yeterli stokta 🎉</Text>
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
                    <Icon source="information-outline" size={13} color="#AAA" />
                    <Text style={s.stockNoteText}>Bar = mevcut stok / minimum stok seviyesi</Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16 },
    branchHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
    branchHeaderText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },

    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    periodChip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
    periodText: { fontSize: 11, fontWeight: '700', color: '#555' },

    section: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
    kpiRow: { flexDirection: 'row', gap: 10 },

    chartCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: '#888' },

    empty: { textAlign: 'center', color: '#AAA', fontSize: 13, paddingVertical: 20 },

    stockNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
    stockNoteText: { fontSize: 10, color: '#AAA' },
});
