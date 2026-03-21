import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Text, List, Divider, Switch, Icon } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../theme/useTheme';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';

const CHANGELOG = `v1.0.0 — Mart 2026
• Gerçek zamanlı Supabase entegrasyonu
• OMS, Transfer, Sevkiyat modülleri
• Barkod tarayıcı desteği
• Animasyonlu raporlar & grafikler
• Push bildirim altyapısı
• Karanlık mod desteği`;

const NOTIF_KEYS = [
    { key: 'notif_orders', label: 'Sipariş Bildirimleri', icon: 'clipboard-list-outline', color: GREEN },
    { key: 'notif_transfers', label: 'Transfer Bildirimleri', icon: 'swap-horizontal-bold', color: PURPLE },
    { key: 'notif_stock', label: 'Stok Uyarıları', icon: 'package-variant-closed', color: '#E8A020' },
    { key: 'notif_shipment', label: 'Sevkiyat Bildirimleri', icon: 'truck-check-outline', color: '#E05C5C' },
];

export default function SettingsScreen() {
    const theme = useTheme();
    const { isDarkMode, toggleTheme, followSystem, setFollowSystem, user, activeBranch, branches, setActiveBranch } = useAppStore(
        useShallow(s => ({
            isDarkMode: s.isDarkMode,
            toggleTheme: s.toggleTheme,
            followSystem: s.followSystem,
            setFollowSystem: s.setFollowSystem,
            user: s.user,
            activeBranch: s.activeBranch,
            branches: s.branches,
            setActiveBranch: s.setActiveBranch,
        }))
    );
    const { logout } = useAuth();
    const { showToast } = useToast();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [connTesting, setConnTesting] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    // Bildirim toggle state'leri
    const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
        notif_orders: true,
        notif_transfers: true,
        notif_stock: true,
        notif_shipment: true,
    });

    // AsyncStorage'dan yükle
    useEffect(() => {
        const loadToggles = async () => {
            try {
                const saved = await AsyncStorage.getItem('notif_toggles');
                if (saved) setNotifToggles(JSON.parse(saved));
            } catch { }
        };
        loadToggles();
    }, []);

    const setNotifToggle = async (key: string, value: boolean) => {
        const next = { ...notifToggles, [key]: value };
        setNotifToggles(next);
        try {
            await AsyncStorage.setItem('notif_toggles', JSON.stringify(next));
        } catch { }
    };

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Oturumunuzu kapatmak istediğinize emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
            ]
        );
    };

    const handleBranchChange = (branchId: string) => {
        const b = branches.find(b => b.id === branchId);
        if (b) { setActiveBranch(b); }
    };

    const handleTestConnection = async () => {
        setConnTesting(true);
        try {
            const { error } = await supabase.from('products').select('id').limit(1);
            if (error) throw error;
            showToast({ message: '✅ Bağlantı başarılı!', type: 'success' });
        } catch (e: any) {
            showToast({ message: `❌ Bağlantı hatası: ${e.message ?? 'Bilinmeyen hata'}`, type: 'error' });
        } finally {
            setConnTesting(false);
        }
    };

    return (
        <ScrollView style={[s.root, { backgroundColor: theme.bg }]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Changelog Modal (inline) */}
            {showChangelog && (
                <View style={s.changelogCard}>
                    <View style={s.changelogHeader}>
                        <Text style={s.changelogTitle}>Sürüm Notları</Text>
                        <TouchableOpacity onPress={() => setShowChangelog(false)}>
                            <Icon source="close" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.changelogText}>{CHANGELOG}</Text>
                </View>
            )}

            {/* Hesap Bilgisi - Hero Banner */}
            <View style={s.heroCard}>
                <View style={s.heroBg} />
                <View style={s.heroAvatarWrap}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{user?.name?.slice(0, 2).toUpperCase() ?? '👤'}</Text>
                    </View>
                    <View style={s.onlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.userName}>{user?.name ?? 'Kullanıcı'}</Text>
                    <Text style={s.userEmail}>{user?.email ?? '—'}</Text>
                </View>
                <View style={[s.roleBadge, { backgroundColor: user?.role === 'admin' ? '#6C63FF20' : user?.role === 'operator' ? '#2A7A5020' : '#88888820' }]}>
                    <Text style={[s.roleText, { color: user?.role === 'admin' ? '#6C63FF' : user?.role === 'operator' ? GREEN : '#888' }]}>
                        {user?.role?.toUpperCase() ?? ''}
                    </Text>
                </View>
            </View>

            {/* GÖRÜNÜM */}
            <Text style={[s.section, { color: theme.textMuted }]}>GÖRÜNÜM</Text>
            <View style={[s.card, { backgroundColor: theme.card }]}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#1A7A5012' }]}>
                        <Icon source="cellphone" size={18} color={GREEN} />
                    </View>
                    <Text style={[s.rowLabel, { color: theme.text }]}>Sistem Teması Takip Et</Text>
                    <Switch value={followSystem} onValueChange={setFollowSystem} color={GREEN} />
                </View>
                <Divider style={{ backgroundColor: theme.divider }} />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#1A1A1A12' }]}>
                        <Icon source={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={18} color="#1A1A1A" />
                    </View>
                    <Text style={[s.rowLabel, { color: followSystem ? theme.textMuted : theme.text }]}>Karanlık Mod</Text>
                    <Switch value={isDarkMode} onValueChange={toggleTheme} color={GREEN} disabled={followSystem} />
                </View>
                <Divider style={{ backgroundColor: theme.divider }} />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#2196F312' }]}>
                        <Icon source="translate" size={18} color="#2196F3" />
                    </View>
                    <Text style={[s.rowLabel, { color: theme.text }]}>Dil</Text>
                    <Text style={[s.rowValue, { color: theme.textMuted }]}>Türkçe</Text>
                </View>
            </View>

            {/* BİLDİRİMLER */}
            <Text style={[s.section, { color: theme.textMuted }]}>BİLDİRİMLER</Text>
            <View style={[s.card, { backgroundColor: theme.card }]}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#E8A02012' }]}>
                        <Icon source="volume-high" size={18} color="#E8A020" />
                    </View>
                    <Text style={[s.rowLabel, { color: theme.text }]}>Sesli Uyarı</Text>
                    <Switch value={soundEnabled} onValueChange={setSoundEnabled} color={GREEN} />
                </View>
                {NOTIF_KEYS.map((n, i) => (
                    <View key={n.key}>
                        <Divider style={{ backgroundColor: theme.divider }} />
                        <View style={s.row}>
                            <View style={[s.rowIconBox, { backgroundColor: n.color + '15' }]}>
                                <Icon source={n.icon} size={18} color={n.color} />
                            </View>
                            <Text style={[s.rowLabel, { color: theme.text }]}>{n.label}</Text>
                            <Switch
                                value={notifToggles[n.key] ?? true}
                                onValueChange={v => setNotifToggle(n.key, v)}
                                color={n.color}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* AKTİF ŞUBE */}
            <Text style={[s.section, { color: theme.textMuted }]}>AKTİF ŞUBE</Text>
            <View style={[s.card, { backgroundColor: theme.card }]}>
                {branches.map((b, i) => (
                    <View key={b.id}>
                        {i > 0 && <Divider style={{ backgroundColor: theme.divider }} />}
                        <TouchableOpacity style={s.row} onPress={() => handleBranchChange(b.id)} activeOpacity={0.7}>
                            <View style={[s.rowIconBox, { backgroundColor: activeBranch?.id === b.id ? `${GREEN}15` : '#88888812' }]}>
                                <Icon source="domain" size={18} color={activeBranch?.id === b.id ? GREEN : '#888'} />
                            </View>
                            <Text style={[s.rowLabel, activeBranch?.id === b.id && { color: GREEN, fontWeight: '700' }, { color: theme.text }]}>
                                {b.name}
                            </Text>
                            {activeBranch?.id === b.id
                                ? <Icon source="check-circle" size={20} color={GREEN} />
                                : <Icon source="circle-outline" size={20} color="#DDD" />
                            }
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* ENTEGRASYON */}
            <Text style={[s.section, { color: theme.textMuted }]}>SİSTEM ENTEGRASYONU</Text>
            <View style={[s.card, { backgroundColor: theme.card }]}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#2196F312' }]}>
                        <Icon source="database-outline" size={18} color="#2196F3" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.rowLabel, { color: theme.text }]}>Supabase DB</Text>
                        <Text style={[s.rowValueSmall, { color: theme.textMuted }]}>Gerçek zamanlı bağlantı</Text>
                    </View>
                    <View style={[s.connBadge, { backgroundColor: '#2A7A5015' }]}>
                        <View style={s.connDot} />
                        <Text style={s.connText}>Aktif</Text>
                    </View>
                </View>
                <Divider style={{ backgroundColor: theme.divider }} />
                <TouchableOpacity style={s.row} onPress={handleTestConnection} disabled={connTesting} activeOpacity={0.7}>
                    <View style={[s.rowIconBox, { backgroundColor: '#6C63FF12' }]}>
                        <Icon source={connTesting ? 'loading' : 'connection'} size={18} color={PURPLE} />
                    </View>
                    <Text style={[s.rowLabel, { color: PURPLE }]}>
                        {connTesting ? 'Test Ediliyor...' : 'Bağlantı Test Et'}
                    </Text>
                    <Icon source="chevron-right" size={18} color="#DDD" />
                </TouchableOpacity>
            </View>

            {/* HAKKINDA */}
            <Text style={[s.section, { color: theme.textMuted }]}>HAKKINDA</Text>
            <View style={[s.card, { backgroundColor: theme.card }]}>
                <TouchableOpacity style={s.row} onPress={() => setShowChangelog(!showChangelog)} activeOpacity={0.7}>
                    <View style={[s.rowIconBox, { backgroundColor: '#6C63FF12' }]}>
                        <Icon source="information-outline" size={18} color="#6C63FF" />
                    </View>
                    <Text style={[s.rowLabel, { color: theme.text }]}>Uygulama Versiyonu</Text>
                    <Text style={[s.rowValue, { color: PURPLE }]}>1.0.0 ›</Text>
                </TouchableOpacity>
                <Divider style={{ backgroundColor: theme.divider }} />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#E8A02012' }]}>
                        <Icon source="code-tags" size={18} color="#E8A020" />
                    </View>
                    <Text style={[s.rowLabel, { color: theme.text }]}>Platform</Text>
                    <Text style={[s.rowValue, { color: theme.textMuted }]}>Expo / React Native</Text>
                </View>
            </View>

            {/* ÇIKIŞ */}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Icon source="logout" size={20} color="#E05C5C" />
                <Text style={s.logoutText}>Oturumu Kapat</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    scroll: { padding: 16 },
    section: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { borderRadius: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    rowIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    rowValue: { fontSize: 13, color: '#888', fontWeight: '600' },
    rowValueSmall: { fontSize: 11, color: '#AAA', marginTop: 1 },
    connBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    connDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
    connText: { fontSize: 11, fontWeight: '700', color: GREEN },
    // Hero Hesap Kartı
    heroCard: { backgroundColor: '#2A7A50', borderRadius: 20, padding: 18, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
    heroBg: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)', right: -30, top: -40 },
    heroAvatarWrap: { position: 'relative' },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: 'white' },
    onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#2A7A50' },
    userName: { fontSize: 15, fontWeight: '700', color: 'white' },
    userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
    roleText: { fontSize: 10, fontWeight: '800', color: 'white' },
    // Changelog
    changelogCard: { backgroundColor: '#1A1A2E', borderRadius: 18, padding: 18, marginBottom: 16 },
    changelogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    changelogTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    changelogText: { fontSize: 12, color: '#BFC8D4', lineHeight: 20, fontFamily: 'monospace' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, backgroundColor: '#E05C5C12', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#E05C5C30' },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#E05C5C' },
    // Legacy
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
});
