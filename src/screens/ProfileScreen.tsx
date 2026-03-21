import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Modal } from 'react-native';
import { Text, Icon, Switch, Divider } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, ROLE_LABELS } from '../store/useAppStore';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';

const ROLE_COLORS: Record<string, string> = {
    admin: PURPLE,
    operator: GREEN,
    viewer: '#888',
};

const AVATAR_COLORS = [
    '#2A7A50', '#6C63FF', '#E05C5C', '#E8A020',
    '#2196F3', '#FF5F96', '#00BCD4', '#FF7043',
];

const AVATAR_STORAGE_KEY = 'profile_avatar_color';

export default function ProfileScreen() {
    const { user, isDarkMode, toggleTheme, activeBranch } = useAppStore(
        useShallow(s => ({
            user: s.user,
            isDarkMode: s.isDarkMode,
            toggleTheme: s.toggleTheme,
            activeBranch: s.activeBranch,
        }))
    );
    const { logout } = useAuth();
    const [avatarColor, setAvatarColor] = useState(GREEN);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(AVATAR_STORAGE_KEY).then(c => { if (c) setAvatarColor(c); }).catch(() => { });
    }, []);

    const selectColor = async (color: string) => {
        setAvatarColor(color);
        setShowColorPicker(false);
        try { await AsyncStorage.setItem(AVATAR_STORAGE_KEY, color); } catch { }
    };

    const roleColor = user?.role ? (ROLE_COLORS[user.role] ?? '#888') : '#888';
    const roleLabel = user?.role ? ((ROLE_LABELS as any)[user.role] ?? user.role) : '';
    const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Oturumunuzu kapatmak istiyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Avatar Renk Seçici Modal */}
            <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
                <TouchableOpacity style={cp.overlay} onPress={() => setShowColorPicker(false)} activeOpacity={1}>
                    <View style={cp.modal}>
                        <Text style={cp.title}>Avatar Rengi Seç</Text>
                        <View style={cp.grid}>
                            {AVATAR_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[cp.swatch, { backgroundColor: color }, avatarColor === color && cp.swatchActive]}
                                    onPress={() => selectColor(color)}
                                    activeOpacity={0.8}
                                >
                                    {avatarColor === color && <Icon source="check" size={20} color="#FFF" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Hero Avatar Alanı */}
            <View style={[s.hero, { backgroundColor: avatarColor }]}>
                <View style={s.heroBg} />

                <TouchableOpacity
                    style={s.avatarWrap}
                    onPress={() => setShowColorPicker(true)}
                    activeOpacity={0.85}
                >
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{initials}</Text>
                    </View>
                    {/* Düzenleme badge */}
                    <View style={s.editBadge}>
                        <Icon source="palette-outline" size={10} color="#FFF" />
                    </View>
                    <View style={s.onlineDot} />
                </TouchableOpacity>

                <Text style={s.heroName}>{user?.name ?? 'Kullanıcı'}</Text>
                <Text style={s.heroEmail}>{user?.email ?? '—'}</Text>

                <View style={s.heroBadgeRow}>
                    <View style={[s.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <View style={[s.roleDot, { backgroundColor: '#FFF' }]} />
                        <Text style={[s.roleText, { color: '#FFF' }]}>{roleLabel}</Text>
                    </View>
                    {activeBranch && (
                        <View style={s.branchBadge}>
                            <Icon source="domain" size={11} color="#888" />
                            <Text style={s.branchBadgeText}>{activeBranch.name}</Text>
                        </View>
                    )}
                </View>

                {/* Renk seçme ipucu */}
                <View style={s.colorHint}>
                    <Icon source="palette-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={s.colorHintText}>Avatar'a dokun → renk seç</Text>
                </View>
            </View>

            {/* Stat Satırı */}
            <View style={s.statRow}>
                <StatItem icon="clipboard-list-outline" label="Modül" value="4" color={GREEN} />
                <View style={s.statDivider} />
                <StatItem icon="domain" label="Şube" value="1" color={PURPLE} />
                <View style={s.statDivider} />
                <StatItem icon="shield-account-outline" label="Rol" value={roleLabel} color={roleColor} />
            </View>

            {/* Ayarlar Bölümü */}
            <Text style={s.sectionLabel}>GÖRÜNÜM</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <View style={[s.rowIcon, { backgroundColor: '#1A1A1A12' }]}>
                        <Icon source={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={18} color="#1A1A1A" />
                    </View>
                    <Text style={s.rowLabel}>Karanlık Mod</Text>
                    <Switch value={isDarkMode} onValueChange={toggleTheme} color={GREEN} />
                </View>
            </View>

            <Text style={s.sectionLabel}>HESAP</Text>
            <View style={s.card}>
                <SettingRow icon="email-outline" iconBg="#6C63FF15" iconColor={PURPLE} label="E-posta" value={user?.email ?? '—'} />
                <Divider />
                <SettingRow icon="account-badge-outline" iconBg={`${roleColor}12`} iconColor={roleColor} label="Rol" value={roleLabel} />
                <Divider />
                <SettingRow icon="domain" iconBg="#2A7A5012" iconColor={GREEN} label="Aktif Şube" value={activeBranch?.name ?? '—'} />
            </View>

            <Text style={s.sectionLabel}>HAKKINDA</Text>
            <View style={s.card}>
                <SettingRow icon="cellphone-information" iconBg="#88888812" iconColor="#888" label="Versiyon" value="1.0.0" />
                <Divider />
                <SettingRow icon="code-tags" iconBg="#88888812" iconColor="#888" label="Platform" value="Expo / React Native" />
            </View>

            {/* Çıkış Butonu */}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Icon source="logout" size={20} color="#E05C5C" />
                <Text style={s.logoutText}>Oturumu Kapat</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

function StatItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <View style={si.wrap}>
            <View style={[si.iconBox, { backgroundColor: color + '15' }]}>
                <Icon source={icon} size={16} color={color} />
            </View>
            <Text style={si.value} numberOfLines={1}>{value}</Text>
            <Text style={si.label}>{label}</Text>
        </View>
    );
}
const si = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', gap: 4 },
    iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', maxWidth: 70 },
    label: { fontSize: 10, color: '#AAA' },
});

function SettingRow({ icon, iconBg, iconColor, label, value }: { icon: string; iconBg: string; iconColor: string; label: string; value: string }) {
    return (
        <View style={sr.row}>
            <View style={[sr.icon, { backgroundColor: iconBg }]}>
                <Icon source={icon} size={16} color={iconColor} />
            </View>
            <Text style={sr.label}>{label}</Text>
            <Text style={sr.value} numberOfLines={1}>{value}</Text>
        </View>
    );
}
const sr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    label: { flex: 1, fontSize: 14, color: '#333' },
    value: { fontSize: 13, color: '#888', fontWeight: '600', maxWidth: 140 },
});

/* ── Color Picker Styles ─────────────────────────────────── */
const cp = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '80%', maxWidth: 320, gap: 18, alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    swatch: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
    swatchActive: { borderWidth: 3, borderColor: '#FFF', transform: [{ scale: 1.08 }] },
});

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { paddingBottom: 32 },

    // Hero
    hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 30, overflow: 'hidden' },
    heroBg: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.07)', top: -80 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 28, fontWeight: '800', color: 'white' },
    editBadge: { position: 'absolute', right: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    onlineDot: { position: 'absolute', right: 3, bottom: 3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2.5, borderColor: 'transparent' },
    heroName: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
    heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
    heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    roleDot: { width: 6, height: 6, borderRadius: 3 },
    roleText: { fontSize: 11, fontWeight: '700' },
    branchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    branchBadgeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
    colorHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, opacity: 0.7 },
    colorHintText: { fontSize: 10.5, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

    // Stat row
    statRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: -22, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
    statDivider: { width: 1, backgroundColor: '#F0F0F0', marginHorizontal: 4 },

    // Settings
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginTop: 24, marginBottom: 8, paddingHorizontal: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 18, marginHorizontal: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 14, color: '#333' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginHorizontal: 16, marginTop: 24,
        backgroundColor: '#E05C5C10', borderRadius: 16, padding: 15,
        borderWidth: 1, borderColor: '#E05C5C30',
    },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#E05C5C' },
});
