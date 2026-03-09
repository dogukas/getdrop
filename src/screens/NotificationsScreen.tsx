import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useActivityStore } from '../store/useActivityStore';
import { ActivityLog, LogLevel } from '../types/database';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<any, 'Notifications'>;

const MODULE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
    OMS: { icon: 'clipboard-list-outline', color: '#2A7A50', bg: '#2A7A5012' },
    Transfer: { icon: 'swap-horizontal-bold', color: '#6C63FF', bg: '#6C63FF12' },
    Sevkiyat: { icon: 'truck-check-outline', color: '#E8A020', bg: '#E8A02012' },
    Stok: { icon: 'package-variant-closed', color: '#E8A020', bg: '#E8A02012' },
    Sistem: { icon: 'cog-outline', color: '#888', bg: '#88888812' },
};

const LEVEL_CONFIG: Record<LogLevel, { color: string; icon: string; label: string }> = {
    success: { color: '#2A7A50', icon: 'check-circle-outline', label: 'Başarılı' },
    warning: { color: '#E8A020', icon: 'alert-outline', label: 'Uyarı' },
    error: { color: '#E05C5C', icon: 'close-circle-outline', label: 'Hata' },
    info: { color: '#6C63FF', icon: 'information-outline', label: 'Bilgi' },
};

type FilterType = 'all' | 'OMS' | 'Transfer' | 'Sevkiyat' | 'Stok';

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'OMS', label: 'OMS' },
    { key: 'Transfer', label: 'Transfer' },
    { key: 'Sevkiyat', label: 'Sevkiyat' },
    { key: 'Stok', label: 'Stok' },
];

function formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} sn önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} g önce`;
}

export default function NotificationsScreen({ navigation }: Props) {
    const logs = useActivityStore(s => s.logs);
    const clearLogs = useActivityStore(s => s.clearLogs);
    const setUnreadCount = useAppStore(s => s.setUnreadCount);
    const [filter, setFilter] = useState<FilterType>('all');

    // Ekran açılınca okundu say
    React.useEffect(() => { setUnreadCount(0); }, []);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.module === filter);

    // Özet sayılar
    const success = logs.filter(l => l.level === 'success').length;
    const warning = logs.filter(l => l.level === 'warning').length;
    const error = logs.filter(l => l.level === 'error').length;
    const info = logs.filter(l => l.level === 'info').length;

    const handleClear = () => {
        Alert.alert('Geçmişi Temizle', 'Tüm aktivite logları silinecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Temizle', style: 'destructive', onPress: () => { clearLogs(); setUnreadCount(0); } },
        ]);
    };

    const recent = filtered.slice(0, 5);
    const older = filtered.slice(5);

    return (
        <View style={s.root}>
            {/* Özet Banner */}
            <View style={s.summaryBar}>
                <MiniStat icon="check-circle-outline" value={success} color="#2A7A50" label="Başarılı" />
                <MiniStat icon="information-outline" value={info} color="#6C63FF" label="Bilgi" />
                <MiniStat icon="alert-outline" value={warning} color="#E8A020" label="Uyarı" />
                <MiniStat icon="close-circle-outline" value={error} color="#E05C5C" label="Hata" />
            </View>

            {/* Filtreler + Temizle */}
            <View style={s.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {FILTERS.map(f => {
                        const active = filter === f.key;
                        return (
                            <FilterChip
                                key={f.key}
                                label={f.label}
                                active={active}
                                onPress={() => setFilter(f.key)}
                            />
                        );
                    })}
                </ScrollView>
                <TouchableOpacity style={s.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                    <Icon source="trash-can-outline" size={16} color="#E05C5C" />
                </TouchableOpacity>
            </View>

            {/* Sonuç sayısı */}
            {filtered.length > 0 && (
                <Text style={s.resultCount}>{filtered.length} kayıt</Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {filtered.length === 0 ? (
                    <View style={s.emptyBox}>
                        <View style={s.emptyIcon}>
                            <Icon source="bell-sleep-outline" size={40} color="#CCC" />
                        </View>
                        <Text style={s.emptyTitle}>Aktivite Yok</Text>
                        <Text style={s.emptySub}>{filter !== 'all' ? 'Bu kategoride kayıt bulunamadı.' : 'Henüz hiç aktivite kaydı yok.'}</Text>
                    </View>
                ) : (
                    <>
                        {recent.length > 0 && (
                            <>
                                <View style={s.groupHeader}>
                                    <Text style={s.groupTitle}>SON AKTİVİTELER</Text>
                                    <View style={s.countPill}><Text style={s.countText}>{recent.length}</Text></View>
                                </View>
                                {recent.map(log => <LogCard key={log.id} log={log} />)}
                            </>
                        )}
                        {older.length > 0 && (
                            <>
                                <View style={[s.groupHeader, { marginTop: 20 }]}>
                                    <Text style={s.groupTitle}>GEÇMİŞ</Text>
                                    <View style={[s.countPill, { backgroundColor: '#88888820' }]}><Text style={[s.countText, { color: '#888' }]}>{older.length}</Text></View>
                                </View>
                                {older.map(log => <LogCard key={log.id} log={log} />)}
                            </>
                        )}
                    </>
                )}
                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

/* ── Mini Stat ──────────────────────────────────────────── */
function MiniStat({ icon, value, color, label }: { icon: string; value: number; color: string; label: string }) {
    return (
        <View style={[ms.wrap, { backgroundColor: color + '12' }]}>
            <Icon source={icon} size={14} color={color} />
            <Text style={[ms.val, { color }]}>{value}</Text>
            <Text style={ms.lbl}>{label}</Text>
        </View>
    );
}
const ms = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', borderRadius: 13, paddingVertical: 8, gap: 2 },
    val: { fontSize: 15, fontWeight: '800' },
    lbl: { fontSize: 9, color: '#999', fontWeight: '600' },
});

/* ── Filter Chip ────────────────────────────────────────── */
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const press = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        onPress();
    };
    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={press}
                style={[fc.chip, active && { backgroundColor: '#6C63FF', borderColor: '#6C63FF' }]}
                activeOpacity={0.8}
            >
                <Text style={[fc.label, active && { color: 'white' }]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}
const fc = StyleSheet.create({
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E8E8E8' },
    label: { fontSize: 12, fontWeight: '600', color: '#666' },
});

/* ── Log Kartı ──────────────────────────────────────────── */
function LogCard({ log }: { log: ActivityLog }) {
    const mc = MODULE_CONFIG[log.module] ?? { icon: 'bell-outline', color: '#888', bg: '#88888812' };
    const lc = LEVEL_CONFIG[log.level];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
            {/* Level rengi sol şerit yerine üst bölge */}
            <View style={[s.cardTop, { backgroundColor: mc.bg }]}>
                <View style={[s.iconBox, { backgroundColor: mc.color + '20' }]}>
                    <Icon source={mc.icon} size={18} color={mc.color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>{log.title}</Text>
                    <View style={s.moduleRow}>
                        <View style={[s.levelDot, { backgroundColor: lc.color }]} />
                        <Text style={s.moduleName}>{log.module}</Text>
                        <Text style={s.levelLabel}>{lc.label}</Text>
                    </View>
                </View>
                <Text style={s.timeText}>{formatTime(log.timestamp)}</Text>
            </View>
            <View style={s.cardBody}>
                <Text style={s.cardDesc} numberOfLines={2}>{log.description}</Text>
                {log.user && (
                    <View style={s.userRow}>
                        <Icon source="account-circle-outline" size={12} color="#AAA" />
                        <Text style={s.userName}>{log.user}</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    summaryBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
    clearBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E05C5C12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E05C5C25' },
    resultCount: { fontSize: 12, color: '#AAA', fontWeight: '600', paddingHorizontal: 16, marginTop: 8 },
    scroll: { padding: 16, paddingTop: 10, paddingBottom: 40 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    groupTitle: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2 },
    countPill: { backgroundColor: '#6C63FF20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    countText: { fontSize: 11, fontWeight: '800', color: '#6C63FF' },
    emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#888' },
    emptySub: { fontSize: 13, color: '#BBB', textAlign: 'center', paddingHorizontal: 40 },
    card: { backgroundColor: '#FFF', borderRadius: 18, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', flex: 1 },
    moduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    levelDot: { width: 6, height: 6, borderRadius: 3 },
    moduleName: { fontSize: 10, fontWeight: '700', color: '#AAA' },
    levelLabel: { fontSize: 10, color: '#CCC' },
    timeText: { fontSize: 10, color: '#CCC', alignSelf: 'flex-start' },
    cardBody: { padding: 14, paddingTop: 10 },
    cardDesc: { fontSize: 12, color: '#666', lineHeight: 17 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    userName: { fontSize: 11, color: '#AAA' },
});
