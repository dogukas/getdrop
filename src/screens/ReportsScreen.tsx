import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';
const ORANGE = '#E8A020';
const RED = '#E05C5C';

/* ── Basit Bar Grafik ────────────────────────────────────── */
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
    const max = Math.max(...data.map(d => d.value));
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
    wrap: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, paddingTop: 8 },
    col: { flex: 1, alignItems: 'center', gap: 4 },
    barBg: { width: '100%', height: 90, borderRadius: 6, backgroundColor: '#F0F0F0', justifyContent: 'flex-end', overflow: 'hidden' },
    bar: { width: '100%', borderRadius: 6 },
    lbl: { fontSize: 9, color: '#888', fontWeight: '600' },
    val: { fontSize: 10, color: '#333', fontWeight: '800' },
});

/* ── KPI Kart ─────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, trend }: {
    icon: string; label: string; value: string; sub: string; color: string; trend: 'up' | 'down' | 'same';
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

/* ── Ana Ekran ─────────────────────────────────────────────── */
export default function ReportsScreen() {
    const { activeBranch } = useAppStore();

    return (
        <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

            {/* Şube Adı */}
            <View style={s.branchHeader}>
                <Icon source="domain" size={24} color={GREEN} />
                <Text style={s.branchHeaderText}>{activeBranch?.name} Raporları</Text>
            </View>

            {/* Dönem seçici */}
            <View style={s.periodRow}>
                {['Bugün', 'Bu Hafta', 'Bu Ay', 'Bu Yıl'].map((p, i) => (
                    <View key={p} style={[s.periodChip, i === 2 && { backgroundColor: GREEN }]}>
                        <Text style={[s.periodText, i === 2 && { color: 'white' }]}>{p}</Text>
                    </View>
                ))}
            </View>

            {/* KPI Satır 1 */}
            <Text style={s.section}>Operasyon Özeti</Text>
            <View style={s.kpiRow}>
                <KpiCard icon="clipboard-list-outline" label="Toplam Sipariş" value="47" sub="+12% geçen ay" color={GREEN} trend="up" />
                <KpiCard icon="check-circle-outline" label="Tamamlanan" value="35" sub="74% oran" color="#4CAF50" trend="up" />
            </View>
            <View style={[s.kpiRow, { marginTop: 10 }]}>
                <KpiCard icon="swap-horizontal-bold" label="Transfer" value="21" sub="+3 bu hafta" color={PURPLE} trend="same" />
                <KpiCard icon="truck-check-outline" label="Sevkiyat Kabul" value="9" sub="2 ret var" color={ORANGE} trend="down" />
            </View>

            {/* Sipariş Grafiği */}
            <Text style={[s.section, { marginTop: 20 }]}>Aylık Sipariş Akışı</Text>
            <View style={s.chartCard}>
                <BarChart color={GREEN}
                    data={[
                        { label: 'Oca', value: 32 },
                        { label: 'Şub', value: 28 },
                        { label: 'Mar', value: 47 },
                        { label: 'Nis', value: 41 },
                        { label: 'May', value: 55 },
                        { label: 'Haz', value: 38 },
                    ]}
                />
                <View style={s.chartLegend}>
                    <View style={s.legendDot} />
                    <Text style={s.legendText}>Aylık tamamlanan sipariş adedi</Text>
                </View>
            </View>

            {/* Transfer Grafiği */}
            <Text style={[s.section, { marginTop: 12 }]}>Aylık Transfer Hareketi</Text>
            <View style={s.chartCard}>
                <BarChart color={PURPLE}
                    data={[
                        { label: 'Oca', value: 14 },
                        { label: 'Şub', value: 18 },
                        { label: 'Mar', value: 21 },
                        { label: 'Nis', value: 16 },
                        { label: 'May', value: 24 },
                        { label: 'Haz', value: 19 },
                    ]}
                />
                <View style={s.chartLegend}>
                    <View style={[s.legendDot, { backgroundColor: PURPLE }]} />
                    <Text style={s.legendText}>Depolar arası transfer adedi</Text>
                </View>
            </View>

            {/* Depo Doluluk */}
            <Text style={[s.section, { marginTop: 12 }]}>Depo Doluluk Oranları</Text>
            <View style={s.warehouseCard}>
                {[
                    { name: 'İstanbul Ana Depo', pct: 78, color: GREEN },
                    { name: 'Bursa Depo', pct: 45, color: GREEN },
                    { name: 'İzmir Depo', pct: 91, color: ORANGE },
                    { name: 'Ankara Bölge', pct: 33, color: GREEN },
                    { name: 'Esenyurt Depo', pct: 62, color: GREEN },
                ].map(w => (
                    <View key={w.name} style={s.wareRow}>
                        <Text style={s.wareName}>{w.name}</Text>
                        <View style={s.wareBarBg}>
                            <View style={[s.wareBar, { width: `${w.pct}%`, backgroundColor: w.color }]} />
                        </View>
                        <Text style={[s.warePct, { color: w.pct > 85 ? ORANGE : '#1A1A1A' }]}>{w.pct}%</Text>
                    </View>
                ))}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

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
    legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
    legendText: { fontSize: 11, color: '#888' },
    warehouseCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 14 },
    wareRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wareName: { width: 130, fontSize: 11, color: '#555', fontWeight: '600' },
    wareBarBg: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
    wareBar: { height: '100%', borderRadius: 4 },
    warePct: { width: 32, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});
