import React, { useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    Dimensions, Animated, RefreshControl, StatusBar
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { SkeletonList } from '../components/SkeletonLoader';
import { Product } from '../types/database';
import { useActivityStore } from '../store/useActivityStore';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../theme/useTheme';

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

/* ── Stat Cell ──────────────────────────────────────────── */
function StatCell({ label, value, color, textMuted }: { label: string; value: string | number; color: string; textMuted?: string }) {
    return (
        <View style={[sp.cell, { backgroundColor: color + '12' }]}>
            <Text style={[sp.val, { color }]}>{value}</Text>
            <Text style={[sp.lbl, textMuted ? { color: textMuted } : {}]} numberOfLines={1}>{label}</Text>
        </View>
    );
}
const sp = StyleSheet.create({
    cell: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 3, minWidth: 0 },
    val: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    lbl: { fontSize: 10, color: '#999', fontWeight: '600', textAlign: 'center' },
});

/* ── Section Card ───────────────────────────────────────── */
function SectionCard({
    title, subtitle, icon, accentColor, iconBg,
    stats, badge, onPress, delay,
}: {
    title: string; subtitle: string; icon: string; accentColor: string; iconBg: string;
    stats: { label: string; value: string | number; color: string }[];
    badge?: { text: string; color: string };
    onPress?: () => void; delay: number;
}) {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
    const rows: (typeof stats)[] = [];
    for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2));

    return (
        <FadeIn delay={delay}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}
                    style={[sc.card, { backgroundColor: theme.card, shadowOpacity: theme.shadowOpacity }]}
                >
                    <View style={sc.header}>
                        <View style={[sc.iconBox, { backgroundColor: iconBg }]}>
                            <Icon source={icon} size={24} color={accentColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={[sc.title, { color: theme.text }]}>{title}</Text>
                            <Text style={[sc.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
                        </View>
                        {badge && (
                            <View style={[sc.badge, { backgroundColor: badge.color + '18' }]}>
                                <Text style={[sc.badgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        )}
                        <Icon source="chevron-right" size={20} color={theme.textMuted} />
                    </View>
                    <View style={[sc.divider, { backgroundColor: accentColor + '22' }]} />
                    {rows.map((row, ri) => (
                        <View key={ri} style={[sc.statsRow, ri > 0 && { marginTop: 6 }]}>
                            {row.map((st) => <StatCell key={st.label} label={st.label} value={st.value} color={st.color} textMuted={theme.textMuted} />)}
                            {row.length === 1 && <View style={{ flex: 1 }} />}
                        </View>
                    ))}
                </TouchableOpacity>
            </Animated.View>
        </FadeIn>
    );
}
const sc = StyleSheet.create({
    card: { borderRadius: 24, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 5 },
    header: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
    subtitle: { fontSize: 11.5, marginTop: 2 },
    badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, marginRight: 8 },
    badgeText: { fontSize: 10.5, fontWeight: '700' },
    divider: { height: 1, marginVertical: 14 },
    statsRow: { flexDirection: 'row', gap: 8 },
});

/* ── Ana Ekran ──────────────────────────────────────────── */
export default function HomeScreen({ navigation }: Props) {
    const theme = useTheme();
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);

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

    const oPending = orders.filter(o => o.status === 'pending').length;
    const oProcessing = orders.filter(o => o.status === 'processing').length;
    const oCompleted = orders.filter(o => o.status === 'completed').length;
    const oCancelled = orders.filter(o => o.status === 'cancelled').length;

    const tPending = transfers.filter(t => t.status === 'pending').length;
    const tTransit = transfers.filter(t => t.status === 'in_transit').length;
    const tDelivered = transfers.filter(t => t.status === 'delivered').length;

    const sExpected = shipments.filter(s => s.status === 'expected').length;
    const sAccepted = shipments.filter(s => s.status === 'accepted').length;
    const sPartial = shipments.filter(s => s.status === 'partial').length;
    const sRejected = shipments.filter(s => s.status === 'rejected').length;

    const totalActions = orders.length + transfers.length + shipments.length;
    const totalPending = oPending + tPending + sExpected;
    const totalDone = oCompleted + tDelivered + sAccepted;

    const criticalStocks = products.filter((p: Product) => p.stock < p.minStock);
    const recentLogs = useActivityStore(useShallow(s => s.logs.slice(0, 5)));

    const DAILY_TARGET = 50;
    const progressVal = Math.min((oCompleted / DAILY_TARGET) * 100, 100);
    const isTargetReached = oCompleted >= DAILY_TARGET;
    const [shootConfetti, setShootConfetti] = React.useState(false);

    useEffect(() => {
        if (isTargetReached && oCompleted === DAILY_TARGET) {
            setShootConfetti(true);
            setTimeout(() => setShootConfetti(false), 3000);
        }
    }, [isTargetReached, oCompleted]);

    return (
        <View style={[s.root, { backgroundColor: theme.bg }]}>
            {shootConfetti && <ConfettiCannon count={100} origin={{ x: width / 2, y: -20 }} fallSpeed={2500} fadeOut />}
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
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
                        <View style={s.heroBubble3} />
                        <View style={s.heroContent}>
                            <View style={s.heroTextBlock}>
                                <Text style={s.heroGreet}>{greeting} 👋</Text>
                                <Text style={s.heroName}>{user?.name ?? 'Kullanıcı'}</Text>
                                {activeBranch && (
                                    <View style={s.heroBranchPill}>
                                        <Text style={s.heroBranchText} numberOfLines={1}>{activeBranch.name}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={s.heroRight}>
                                <View style={{ position: 'relative', alignItems: 'center' }}>
                                    <AnimatedCircularProgress
                                        size={72} width={6} fill={progressVal}
                                        tintColor="#4CAF50" backgroundColor="rgba(255,255,255,0.2)"
                                        rotation={0} lineCap="round" duration={1000}
                                    >
                                        {(fill: number) => (
                                            <View style={s.heroAvatar}>
                                                <Text style={s.heroAvatarText}>{oCompleted}</Text>
                                                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: -2 }}>/{DAILY_TARGET}</Text>
                                            </View>
                                        )}
                                    </AnimatedCircularProgress>
                                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4 }}>
                                        Günlük Hedef
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </FadeIn>

                {/* ── Özet Bant ────────────────────────────────── */}
                <FadeIn delay={60}>
                    <View style={[s.summaryBand, { backgroundColor: theme.card }]}>
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: theme.text }]}>{totalActions}</Text>
                            <Text style={[s.summaryLbl, { color: theme.textMuted }]}>Toplam</Text>
                        </View>
                        <View style={[s.sumDivider, { backgroundColor: theme.divider }]} />
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: '#E8A020' }]}>{totalPending}</Text>
                            <Text style={[s.summaryLbl, { color: theme.textMuted }]}>Bekleyen</Text>
                        </View>
                        <View style={[s.sumDivider, { backgroundColor: theme.divider }]} />
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: GREEN }]}>{totalDone}</Text>
                            <Text style={[s.summaryLbl, { color: theme.textMuted }]}>Tamamlanan</Text>
                        </View>
                        <View style={[s.sumDivider, { backgroundColor: theme.divider }]} />
                        <View style={s.summaryItem}>
                            <Text style={[s.summaryVal, { color: '#E05C5C' }]}>{criticalStocks.length}</Text>
                            <Text style={[s.summaryLbl, { color: theme.textMuted }]}>Kritik Stok</Text>
                        </View>
                    </View>
                </FadeIn>

                <FadeIn delay={100}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Modüller</Text>
                </FadeIn>

                {isLoading && !refreshing ? (
                    <SkeletonList count={3} />
                ) : (
                    <>
                        <SectionCard delay={140} title="OMS" subtitle="Sipariş Yönetim Sistemi"
                            icon="clipboard-list-outline" accentColor="#2A7A50" iconBg="#E8F5EE"
                            badge={oPending > 0 ? { text: `${oPending} Yeni`, color: '#2A7A50' } : undefined}
                            onPress={() => navigation.push('OMS')}
                            stats={[
                                { label: 'Bekleyen', value: oPending, color: '#E8A020' },
                                { label: 'İşlemde', value: oProcessing, color: '#2A7A50' },
                                { label: 'Tamamlanan', value: oCompleted, color: '#4CAF50' },
                                { label: 'İptal', value: oCancelled, color: '#E05C5C' },
                            ]}
                        />

                        <SectionCard delay={220} title="Transfer Merkezi" subtitle="Depolar arası transfer"
                            icon="swap-horizontal-bold" accentColor="#6C63FF" iconBg="#EEEEFF"
                            badge={tTransit > 0 ? { text: `${tTransit} Aktif`, color: '#6C63FF' } : undefined}
                            onPress={() => navigation.push('Transfer')}
                            stats={[
                                { label: 'Bekleyen', value: tPending, color: '#E8A020' },
                                { label: 'Aktarımda', value: tTransit, color: '#6C63FF' },
                                { label: 'Teslim', value: tDelivered, color: '#4CAF50' },
                            ]}
                        />

                        <SectionCard delay={300} title="Sevkiyat Kabul" subtitle="Gelen mal ve sevkiyat kabulü"
                            icon="truck-check-outline" accentColor="#E8A020" iconBg="#FFF8E6"
                            badge={sExpected > 0 ? { text: `${sExpected} Bekleyen`, color: '#E8A020' } : undefined}
                            onPress={() => navigation.push('Sevkiyat')}
                            stats={[
                                { label: 'Beklenen', value: sExpected, color: '#E8A020' },
                                { label: 'Kabul', value: sAccepted, color: '#4CAF50' },
                                { label: 'Ret', value: sRejected, color: '#E05C5C' },
                                { label: 'Kısmi', value: sPartial, color: '#6C63FF' },
                            ]}
                        />

                        {/* ── Kritik Stok ───────────────────────────── */}
                        <FadeIn delay={380}>
                            <Text style={[s.sectionTitle, { marginTop: 6, color: theme.text }]}>Kritik Stok Uyarısı</Text>
                            {criticalStocks.length === 0 ? (
                                <View style={[s.alertEmpty, { backgroundColor: theme.card }]}>
                                    <Icon source="check-circle-outline" size={28} color="#4CAF50" />
                                    <Text style={s.alertEmptyText}>Tüm stoklar yeterli</Text>
                                </View>
                            ) : (
                                <View style={[s.alertCard, { backgroundColor: theme.card, borderColor: '#E05C5C30' }]}>
                                    {criticalStocks.slice(0, 3).map((prod: Product, idx: number) => (
                                        <View key={prod.id}>
                                            {idx > 0 && <View style={[s.alertDivider, { backgroundColor: theme.divider }]} />}
                                            <View style={s.alertRow}>
                                                <View style={s.alertIconBox}>
                                                    <Icon source="alert-outline" size={18} color="#E05C5C" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[s.alertName, { color: theme.text }]} numberOfLines={1}>{prod.name}</Text>
                                                    <Text style={[s.alertSku, { color: theme.textMuted }]}>{prod.sku}</Text>
                                                </View>
                                                <View style={s.alertQtyBox}>
                                                    <Text style={s.alertQtyText}>{prod.stock} adet</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </FadeIn>

                        {/* ── Son Aktiviteler ─────────────────────── */}
                        <FadeIn delay={440}>
                            <View style={s.feedHeader}>
                                <Text style={[s.sectionTitle, { color: theme.text }]}>Son Aktiviteler</Text>
                                <TouchableOpacity onPress={() => navigation.push('Notifications' as any)} activeOpacity={0.7}>
                                    <Text style={s.feedSeeAll}>Tümünü Gör</Text>
                                </TouchableOpacity>
                            </View>
                            {recentLogs.length === 0 ? (
                                <View style={s.feedEmpty}>
                                    <Icon source="bell-sleep-outline" size={32} color="#CCC" />
                                    <Text style={[s.feedEmptyText, { color: theme.textMuted }]}>Aktivite yok</Text>
                                </View>
                            ) : (
                                <View style={[s.feedCard, { backgroundColor: theme.card }]}>
                                    {recentLogs.map((log, idx) => {
                                        const LEVEL_COLORS: Record<string, string> = { success: '#2A7A50', warning: '#E8A020', error: '#E05C5C', info: '#6C63FF' };
                                        const lColor = LEVEL_COLORS[log.level] ?? '#888';
                                        return (
                                            <View key={log.id}>
                                                {idx > 0 && <View style={[s.feedDivider, { backgroundColor: theme.divider }]} />}
                                                <View style={s.feedRow}>
                                                    <View style={[s.feedDot, { backgroundColor: lColor }]} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[s.feedTitle, { color: theme.text }]} numberOfLines={1}>{log.title}</Text>
                                                        <Text style={[s.feedDesc, { color: theme.textMuted }]} numberOfLines={1}>{log.description}</Text>
                                                    </View>
                                                    <Text style={[s.feedTime, { color: theme.textMuted }]}>
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
    root: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },

    hero: {
        backgroundColor: GREEN,
        borderRadius: 24, marginBottom: 14, overflow: 'hidden',
        shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28, shadowRadius: 18, elevation: 10,
    },
    heroBubble1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', right: -50, top: -50 },
    heroBubble2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', right: 60, bottom: -40 },
    heroBubble3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', left: 20, top: -10 },
    heroContent: { flexDirection: 'row', alignItems: 'center', padding: 22, paddingBottom: 20 },
    heroTextBlock: { flex: 1 },
    heroGreet: { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
    heroName: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 4, letterSpacing: 0.1 },
    heroRight: { alignItems: 'center', gap: 8 },
    heroAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    heroAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    heroBranchPill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
    heroBranchText: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },

    summaryBand: { borderRadius: 18, padding: 16, flexDirection: 'row', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryVal: { fontSize: 20, fontWeight: '800' },
    summaryLbl: { fontSize: 10, marginTop: 2, textAlign: 'center' },
    sumDivider: { width: 1, marginHorizontal: 4 },

    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },

    alertEmpty: { borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    alertEmptyText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
    alertCard: { borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4, borderWidth: 1 },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    alertIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E05C5C15', alignItems: 'center', justifyContent: 'center' },
    alertName: { fontSize: 13, fontWeight: '700' },
    alertSku: { fontSize: 11, marginTop: 2 },
    alertQtyBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#E05C5C15' },
    alertQtyText: { fontSize: 12, fontWeight: '800', color: '#E05C5C' },
    alertDivider: { height: 1, marginVertical: 8 },

    feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 10 },
    feedSeeAll: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
    feedEmpty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    feedEmptyText: { fontSize: 13 },
    feedCard: { borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
    feedDivider: { height: 1, marginVertical: 6 },
    feedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    feedDot: { width: 8, height: 8, borderRadius: 4 },
    feedTitle: { fontSize: 12, fontWeight: '700' },
    feedDesc: { fontSize: 11, marginTop: 1 },
    feedTime: { fontSize: 10, minWidth: 28, textAlign: 'right' },
});
