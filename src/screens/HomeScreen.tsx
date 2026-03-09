import React, { useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    Dimensions, Animated, Easing, RefreshControl, StatusBar
} from 'react-native';
import { Text, Icon, Badge } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { SkeletonList } from '../components/SkeletonLoader';
import { Product } from '../types/database';
import { useActivityStore } from '../store/useActivityStore';

type Props = NativeStackScreenProps<any, 'Home'>;

const { width } = Dimensions.get('window');
const GREEN = '#2A7A50';
const GREEN_DARK = '#1E5E3B';

/* ── Fade-in animasyonu ─────────────────────────────────── */
function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
    const op = useRef(new Animated.Value(0)).current;
    const ty = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
            Animated.timing(ty, { toValue: 0, duration: 480, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}

/* ── Stat Pill ──────────────────────────────────────────── */
function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <View style={[sp.pill, { backgroundColor: `${color} 15` }]}>
            <Text style={[sp.val, { color }]}>{value}</Text>
            <Text style={sp.lbl}>{label}</Text>
        </View>
    );
}
const sp = StyleSheet.create({
    pill: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 2 },
    val: { fontSize: 20, fontWeight: '800' },
    lbl: { fontSize: 10, color: '#888', fontWeight: '500', textAlign: 'center' },
});

/* ── Ana Bölüm Kartı ────────────────────────────────────── */
function SectionCard({
    title, subtitle, icon, accentColor,
    stats, badge, onPress, delay,
}: {
    title: string; subtitle: string; icon: string; accentColor: string;
    stats: { label: string; value: string | number; color: string }[];
    badge?: { text: string; color: string };
    onPress?: () => void; delay: number;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();

    return (
        <FadeIn delay={delay}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    onPress={onPress}
                    style={[sc.card, { borderLeftColor: accentColor }]}
                >
                    {/* Üst satır */}
                    <View style={sc.header}>
                        <View style={[sc.iconBox, { backgroundColor: `${accentColor} 18` }]}>
                            <Icon source={icon} size={26} color={accentColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={sc.title}>{title}</Text>
                            <Text style={sc.subtitle}>{subtitle}</Text>
                        </View>
                        {badge && (
                            <View style={[sc.badge, { backgroundColor: `${badge.color} 18` }]}>
                                <Text style={[sc.badgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        )}
                        <Icon source="chevron-right" size={20} color="#CCC" />
                    </View>

                    {/* İnce ayraç */}
                    <View style={[sc.divider, { backgroundColor: `${accentColor} 20` }]} />

                    {/* Stat sütunları */}
                    <View style={sc.statsRow}>
                        {stats.map((st) => (
                            <StatPill key={st.label} label={st.label} value={st.value} color={st.color} />
                        ))}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </FadeIn>
    );
}
const sc = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 20,
        padding: 18, marginBottom: 14,
        borderLeftWidth: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    },
    header: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.2 },
    subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, marginVertical: 14 },
    statsRow: { flexDirection: 'row', gap: 8 },
});

/* ── Ana Ekran ──────────────────────────────────────────── */
export default function HomeScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    // -- Reaktif Veri (useDataStore) --
    const orders = useDataStore(s => s.orders);
    const transfers = useDataStore(s => s.transfers);
    const shipments = useDataStore(s => s.shipments);
    const products = useDataStore(s => s.products);
    const isLoading = useDataStore(s => s.isLoading);
    const loadAll = useDataStore(s => s.loadAll);

    const [refreshing, setRefreshing] = React.useState(false);
    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

    // OMS
    const branchOrders = orders;
    const oPending = branchOrders.filter(o => o.status === 'pending').length;
    const oProcessing = branchOrders.filter(o => o.status === 'processing').length;
    const oCompleted = branchOrders.filter(o => o.status === 'completed').length;
    const oCancelled = branchOrders.filter(o => o.status === 'cancelled').length;

    // TRANSFER
    const branchTransfers = transfers;
    const tPending = branchTransfers.filter(t => t.status === 'pending').length;
    const tTransit = branchTransfers.filter(t => t.status === 'in_transit').length;
    const tDelivered = branchTransfers.filter(t => t.status === 'delivered').length;

    // SEVKİYAT
    const branchShipments = shipments;
    const sExpected = branchShipments.filter(s => s.status === 'expected').length;
    const sAccepted = branchShipments.filter(s => s.status === 'accepted').length;
    const sPartial = branchShipments.filter(s => s.status === 'partial').length;
    const sRejected = branchShipments.filter(s => s.status === 'rejected').length;

    const totalActions = branchOrders.length + branchTransfers.length + branchShipments.length;
    const totalPending = oPending + tPending + sExpected;
    const totalDone = oCompleted + tDelivered + sAccepted;

    // KRİTİK STOK UYARILARI
    const criticalStocks = products.filter((p: Product) => p.stock < p.minStock);

    // SON AKTİVİTELER
    const recentLogs = useActivityStore(useShallow(s => s.logs.slice(0, 5)));

    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7A50" />}
            >

                {/* ── Hero ─────────────────────────────────────── */}
                <FadeIn delay={0}>
                    <View style={s.hero}>
                        <View style={s.heroBubble1} />
                        <View style={s.heroBubble2} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.heroGreet}>{greeting} 👋</Text>
                            <Text style={s.heroName}>{user?.name ?? 'Kullanıcı'}</Text>
                            <Text style={s.heroSub}>Bugünkü operasyon özetini görüntüleyin</Text>
                        </View>
                        <View style={s.heroAvatar}>
                            <Text style={s.heroAvatarText}>{user?.name?.slice(0, 2).toUpperCase() ?? '👤'}</Text>
                        </View>
                    </View>
                </FadeIn>

                {/* ── Özet Bant ────────────────────────────────── */}
                <FadeIn delay={60}>
                    <View style={s.summaryBand}>
                        <View style={s.summaryItem}>
                            <Text style={s.summaryVal}>{totalActions}</Text>
                            <Text style={s.summaryLbl}>Toplam İşlem</Text>
                        </View>
                        <View style={s.sumDivider} />
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: '#E8A020' }]}>{totalPending}</Text>
                            <Text style={s.summaryLbl}>Bekleyen</Text>
                        </View>
                        <View style={s.sumDivider} />
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: GREEN }]}>{totalDone}</Text>
                            <Text style={s.summaryLbl}>Tamamlanan</Text>
                        </View>
                    </View>
                </FadeIn>

                {/* ── Bölüm Başlık ─────────────────────────────── */}
                <FadeIn delay={100}>
                    <Text style={s.sectionTitle}>Modüller</Text>
                </FadeIn>

                {isLoading && !refreshing ? (
                    <SkeletonList count={3} />
                ) : (
                    <>
                        {/* ── 1. OMS ───────────────────────────────────── */}
                        <SectionCard
                            delay={140}
                            title="OMS"
                            subtitle="Sipariş Yönetim Sistemi"
                            icon="clipboard-list-outline"
                            accentColor="#2A7A50"
                            badge={oPending > 0 ? { text: `${oPending} Yeni`, color: '#2A7A50' } : undefined}
                            onPress={() => navigation.push('OMS')}
                            stats={[
                                { label: 'Bekleyen', value: oPending, color: '#E8A020' },
                                { label: 'İşlemde', value: oProcessing, color: '#2A7A50' },
                                { label: 'Tamamlanan', value: oCompleted, color: '#4CAF50' },
                                { label: 'İptal', value: oCancelled, color: '#E05C5C' },
                            ]}
                        />

                        {/* ── 2. Transfer Merkezi ──────────────────────── */}
                        <SectionCard
                            delay={220}
                            title="Transfer Merkezi"
                            subtitle="Depo içi / depolar arası transfer"
                            icon="swap-horizontal-bold"
                            accentColor="#6C63FF"
                            badge={tTransit > 0 ? { text: `${tTransit} Aktif`, color: '#6C63FF' } : undefined}
                            onPress={() => navigation.push('Transfer')}
                            stats={[
                                { label: 'Bekleyen', value: tPending, color: '#E8A020' },
                                { label: 'Aktarımda', value: tTransit, color: '#6C63FF' },
                                { label: 'Teslim', value: tDelivered, color: '#4CAF50' },
                            ]}
                        />

                        {/* ── 3. Sevkiyat Kabul ────────────────────────── */}
                        <SectionCard
                            delay={300}
                            title="Sevkiyat Kabul"
                            subtitle="Gelen mal ve sevkiyat kabulü"
                            icon="truck-check-outline"
                            accentColor="#E8A020"
                            badge={sExpected > 0 ? { text: `${sExpected} Bekleyen`, color: '#E8A020' } : undefined}
                            onPress={() => navigation.push('Sevkiyat')}
                            stats={[
                                { label: 'Beklenen', value: sExpected, color: '#E8A020' },
                                { label: 'Kabul', value: sAccepted, color: '#4CAF50' },
                                { label: 'Ret', value: sRejected, color: '#E05C5C' },
                                { label: 'Kısmi', value: sPartial, color: '#6C63FF' },
                            ]}
                        />

                        {/* ── 4. Kritik Stok Uyarıları ───────────────────── */}
                        <FadeIn delay={380}>
                            <Text style={[s.sectionTitle, { marginTop: 16 }]}>Kritik Stok Uyarısı</Text>
                            <View style={s.alertCard}>
                                {criticalStocks.slice(0, 3).map((prod: Product, idx: number) => (
                                    <View key={prod.id}>
                                        {idx > 0 && <View style={s.alertDivider} />}
                                        <View style={s.alertRow}>
                                            <View style={s.alertIconBox}>
                                                <Icon source="alert-outline" size={18} color="#E05C5C" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.alertName} numberOfLines={1}>{prod.name}</Text>
                                                <Text style={s.alertSku}>{prod.sku}</Text>
                                            </View>
                                            <View style={s.alertQtyBox}>
                                                <Text style={s.alertQtyText}>{prod.stock} adet</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </FadeIn>

                        {/* ── 5. Son Aktiviteler Feed ─────────────────── */}
                        <FadeIn delay={440}>
                            <View style={s.feedHeader}>
                                <Text style={s.sectionTitle}>Son Aktiviteler</Text>
                                <TouchableOpacity onPress={() => navigation.push('Notifications' as any)} activeOpacity={0.7}>
                                    <Text style={s.feedSeeAll}>Tümünü Gör</Text>
                                </TouchableOpacity>
                            </View>
                            {recentLogs.length === 0 ? (
                                <View style={s.feedEmpty}>
                                    <Icon source="bell-sleep-outline" size={32} color="#CCC" />
                                    <Text style={s.feedEmptyText}>Aktivite yok</Text>
                                </View>
                            ) : (
                                <View style={s.feedCard}>
                                    {recentLogs.map((log, idx) => {
                                        const LEVEL_COLORS: Record<string, string> = { success: '#2A7A50', warning: '#E8A020', error: '#E05C5C', info: '#6C63FF' };
                                        const lColor = LEVEL_COLORS[log.level] ?? '#888';
                                        return (
                                            <View key={log.id}>
                                                {idx > 0 && <View style={s.feedDivider} />}
                                                <View style={s.feedRow}>
                                                    <View style={[s.feedDot, { backgroundColor: lColor }]} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={s.feedTitle} numberOfLines={1}>{log.title}</Text>
                                                        <Text style={s.feedDesc} numberOfLines={1}>{log.description}</Text>
                                                    </View>
                                                    <Text style={s.feedTime}>
                                                        {Math.floor((Date.now() - log.timestamp.getTime()) / 60000)} dk
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </FadeIn>
                    </>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },

    /* Hero */
    hero: {
        backgroundColor: GREEN, borderRadius: 22, padding: 22,
        marginBottom: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
        shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    heroBubble1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)', right: -20, top: -30 },
    heroBubble2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', right: 70, bottom: -20 },
    heroGreet: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    heroName: { fontSize: 21, fontWeight: '800', color: '#FFF', marginTop: 3, letterSpacing: 0.2 },
    heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
    heroAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
    heroAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },

    /* Summary band */
    summaryBand: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 16,
        flexDirection: 'row', marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryVal: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
    summaryLbl: { fontSize: 11, color: '#888', marginTop: 2 },
    sumDivider: { width: 1, backgroundColor: '#F0F0F0', marginHorizontal: 8 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

    /* Stok Uyarısı */
    alertCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: '#FFEBEB' },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    alertIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E05C5C15', alignItems: 'center', justifyContent: 'center' },
    alertName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    alertSku: { fontSize: 11, color: '#888', marginTop: 2 },
    alertQtyBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#E05C5C15' },
    alertQtyText: { fontSize: 12, fontWeight: '800', color: '#E05C5C' },
    alertDivider: { height: 1, backgroundColor: '#FFF0F0', marginVertical: 8 },

    /* Son Aktiviteler Feed */
    feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 10 },
    feedSeeAll: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
    feedEmpty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    feedEmptyText: { fontSize: 13, color: '#CCC' },
    feedCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    feedDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 6 },
    feedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    feedDot: { width: 8, height: 8, borderRadius: 4 },
    feedTitle: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
    feedDesc: { fontSize: 11, color: '#888', marginTop: 1 },
    feedTime: { fontSize: 10, color: '#AAA', minWidth: 28, textAlign: 'right' },
});
