import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useActivityStore, ActivityLog, LogLevel } from '../store/useActivityStore';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<any, 'Notifications'>;

const MODULE_ICONS: Record<string, { icon: string; color: string }> = {
    OMS: { icon: 'clipboard-list-outline', color: '#2A7A50' },
    Transfer: { icon: 'swap-horizontal-bold', color: '#6C63FF' },
    Sevkiyat: { icon: 'truck-check-outline', color: '#E8A020' },
    Stok: { icon: 'package-variant-closed', color: '#E8A020' },
    Sistem: { icon: 'cog-outline', color: '#888' },
};

const LEVEL_COLORS: Record<LogLevel, string> = {
    success: '#2A7A50',
    warning: '#E8A020',
    error: '#E05C5C',
    info: '#6C63FF',
};

function formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} sn önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
}

export default function NotificationsScreen({ navigation }: Props) {
    const logs = useActivityStore(s => s.logs);
    const clearLogs = useActivityStore(s => s.clearLogs);
    const decrementUnread = useAppStore(s => s.decrementUnread);
    const setUnreadCount = useAppStore(s => s.setUnreadCount);
    const [hasRead, setHasRead] = useState(false);

    // Ekran açılınca tüm bildirimleri okundu say
    useEffect(() => { setUnreadCount(0); setHasRead(true); }, []);

    const recent = logs.slice(0, 5);
    const older = logs.slice(5);

    const handleClear = () => {
        Alert.alert('Geçmişi Temizle', 'Tüm aktivite logları silinecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Temizle', style: 'destructive', onPress: () => { clearLogs(); setUnreadCount(0); } },
        ]);
    };

    const markAllRead = () => {
        setUnreadCount(0);
        setHasRead(true);
    };

    return (
        <View style={s.root}>
            {/* Üst Araç Çubuğu */}
            <View style={s.toolbar}>
                <TouchableOpacity onPress={markAllRead} style={s.toolBtn} activeOpacity={0.7}>
                    <Icon source="check-all" size={16} color="#2A7A50" />
                    <Text style={[s.toolBtnText, { color: '#2A7A50' }]}>Tümünü Okundu İşaretle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClear} style={s.toolBtn} activeOpacity={0.7}>
                    <Icon source="trash-can-outline" size={16} color="#E05C5C" />
                    <Text style={[s.toolBtnText, { color: '#E05C5C' }]}>Temizle</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {logs.length === 0 ? (
                    <View style={s.empty}>
                        <Icon source="bell-sleep-outline" size={56} color="#DDD" />
                        <Text style={s.emptyText}>Henüz aktivite yok</Text>
                    </View>
                ) : (
                    <>
                        {/* Son Aktiviteler */}
                        <View style={s.groupHeader}>
                            <Text style={s.groupTitle}>SON AKTİVİTELER</Text>
                            <View style={s.countBadge}>
                                <Text style={s.countBadgeText}>{recent.length}</Text>
                            </View>
                        </View>
                        {recent.map(log => <LogCard key={log.id} log={log} />)}

                        {/* Eski Kayıtlar */}
                        {older.length > 0 && (
                            <>
                                <Text style={[s.groupTitle, { marginTop: 20, marginBottom: 10 }]}>GEÇMİŞ</Text>
                                {older.map(log => <LogCard key={log.id} log={log} />)}
                            </>
                        )}
                    </>
                )}

            </ScrollView>
        </View>
    );
}

function LogCard({ log }: { log: ActivityLog }) {
    const moduleConfig = MODULE_ICONS[log.module] ?? { icon: 'bell-outline', color: '#888' };
    const levelColor = LEVEL_COLORS[log.level];

    return (
        <View style={s.card}>
            {/* Sol renkli çizgi (level rengi) */}
            <View style={[s.levelBar, { backgroundColor: levelColor }]} />

            <View style={[s.iconBox, { backgroundColor: `${moduleConfig.color}15` }]}>
                <Icon source={moduleConfig.icon} size={20} color={moduleConfig.color} />
            </View>

            <View style={{ flex: 1 }}>
                <View style={s.cardHeader}>
                    <Text style={s.cardTitle} numberOfLines={1}>{log.title}</Text>
                    <View style={[s.moduleBadge, { backgroundColor: `${moduleConfig.color}12` }]}>
                        <Text style={[s.moduleBadgeText, { color: moduleConfig.color }]}>{log.module}</Text>
                    </View>
                </View>
                <Text style={s.cardDesc} numberOfLines={2}>{log.description}</Text>
                <View style={s.cardFooter}>
                    {log.user && (
                        <View style={s.userTag}>
                            <Icon source="account-outline" size={11} color="#AAA" />
                            <Text style={s.userTagText}>{log.user}</Text>
                        </View>
                    )}
                    <Text style={s.timeText}>{formatTime(log.timestamp)}</Text>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    toolbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10 },
    toolBtnText: { fontSize: 12, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 32 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 15, color: '#AAA' },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    groupTitle: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2 },
    countBadge: { backgroundColor: '#6C63FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    countBadgeText: { fontSize: 11, fontWeight: '800', color: 'white' },
    card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden', position: 'relative' },
    levelBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    moduleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    moduleBadgeText: { fontSize: 10, fontWeight: '700' },
    cardDesc: { fontSize: 12, color: '#666', lineHeight: 17 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    userTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    userTagText: { fontSize: 11, color: '#AAA' },
    timeText: { fontSize: 11, color: '#AAA' },
});
