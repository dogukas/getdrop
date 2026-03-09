import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, List, Divider, Switch, Icon } from 'react-native-paper';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../context/AuthContext';

const GREEN = '#2A7A50';

export default function SettingsScreen() {
    const { isDarkMode, toggleTheme, user, activeBranch, branches, setActiveBranch } = useAppStore(
        useShallow(s => ({
            isDarkMode: s.isDarkMode,
            toggleTheme: s.toggleTheme,
            user: s.user,
            activeBranch: s.activeBranch,
            branches: s.branches,
            setActiveBranch: s.setActiveBranch,
        }))
    );
    const { logout } = useAuth();
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

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

    return (
        <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

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
            <Text style={s.section}>GÖRÜNÜM</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#1A1A1A12' }]}>
                        <Icon source={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={18} color="#1A1A1A" />
                    </View>
                    <Text style={s.rowLabel}>Karanlık Mod</Text>
                    <Switch value={isDarkMode} onValueChange={toggleTheme} color={GREEN} />
                </View>
                <Divider />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#2196F312' }]}>
                        <Icon source="translate" size={18} color="#2196F3" />
                    </View>
                    <Text style={s.rowLabel}>Dil</Text>
                    <Text style={s.rowValue}>Türkçe</Text>
                </View>
            </View>

            {/* BİLDİRİMLER */}
            <Text style={s.section}>BİLDİRİMLER</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#E05C5C12' }]}>
                        <Icon source="bell-outline" size={18} color="#E05C5C" />
                    </View>
                    <Text style={s.rowLabel}>Push Bildirimler</Text>
                    <Switch value={notifEnabled} onValueChange={setNotifEnabled} color={GREEN} />
                </View>
                <Divider />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#E8A02012' }]}>
                        <Icon source="volume-high" size={18} color="#E8A020" />
                    </View>
                    <Text style={s.rowLabel}>Sesli Uyarı</Text>
                    <Switch value={soundEnabled} onValueChange={setSoundEnabled} color={GREEN} />
                </View>
            </View>

            {/* AKTİF ŞUBE */}
            <Text style={s.section}>AKTİF ŞUBE</Text>
            <View style={s.card}>
                {branches.map((b, i) => (
                    <View key={b.id}>
                        {i > 0 && <Divider />}
                        <TouchableOpacity style={s.row} onPress={() => handleBranchChange(b.id)} activeOpacity={0.7}>
                            <View style={[s.rowIconBox, { backgroundColor: activeBranch?.id === b.id ? `${GREEN}15` : '#88888812' }]}>
                                <Icon source="domain" size={18} color={activeBranch?.id === b.id ? GREEN : '#888'} />
                            </View>
                            <Text style={[s.rowLabel, activeBranch?.id === b.id && { color: GREEN, fontWeight: '700' }]}>
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

            {/* HAKKINDA */}
            <Text style={s.section}>HAKKINDA</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#6C63FF12' }]}>
                        <Icon source="information-outline" size={18} color="#6C63FF" />
                    </View>
                    <Text style={s.rowLabel}>Uygulama Versiyonu</Text>
                    <Text style={s.rowValue}>1.0.0</Text>
                </View>
                <Divider />
                <View style={s.row}>
                    <View style={[s.rowIconBox, { backgroundColor: '#E8A02012' }]}>
                        <Icon source="code-tags" size={18} color="#E8A020" />
                    </View>
                    <Text style={s.rowLabel}>Platform</Text>
                    <Text style={s.rowValue}>Expo / React Native</Text>
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
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16 },
    section: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    rowIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    rowValue: { fontSize: 13, color: '#888', fontWeight: '600' },
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
    // Eskiden kalan (artık heroCard kullanıyor)
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, backgroundColor: '#E05C5C12', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#E05C5C30' },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#E05C5C' },
});
