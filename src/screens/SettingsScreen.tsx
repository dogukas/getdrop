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

            {/* Hesap Bilgisi */}
            <View style={s.card}>
                <View style={s.avatarRow}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{user?.name?.slice(0, 2).toUpperCase() ?? '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.userName}>{user?.name ?? 'Kullanıcı'}</Text>
                        <Text style={s.userEmail}>{user?.email ?? '—'}</Text>
                    </View>
                    <View style={[s.roleBadge]}>
                        <Text style={s.roleText}>{user?.role?.toUpperCase() ?? ''}</Text>
                    </View>
                </View>
            </View>

            {/* GÖRÜNÜM */}
            <Text style={s.section}>GÖRÜNÜM</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <Icon source={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={20} color={GREEN} />
                    <Text style={s.rowLabel}>Karanlık Mod</Text>
                    <Switch value={isDarkMode} onValueChange={toggleTheme} color={GREEN} />
                </View>
                <Divider />
                <View style={s.row}>
                    <Icon source="translate" size={20} color={GREEN} />
                    <Text style={s.rowLabel}>Dil</Text>
                    <Text style={s.rowValue}>Türkçe</Text>
                </View>
            </View>

            {/* BİLDİRİMLER */}
            <Text style={s.section}>BİLDİRİMLER</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <Icon source="bell-outline" size={20} color={GREEN} />
                    <Text style={s.rowLabel}>Push Bildirimler</Text>
                    <Switch value={notifEnabled} onValueChange={setNotifEnabled} color={GREEN} />
                </View>
                <Divider />
                <View style={s.row}>
                    <Icon source="volume-high" size={20} color={GREEN} />
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
                            <Icon source="domain" size={20} color={activeBranch?.id === b.id ? GREEN : '#888'} />
                            <Text style={[s.rowLabel, activeBranch?.id === b.id && { color: GREEN, fontWeight: '700' }]}>
                                {b.name}
                            </Text>
                            {activeBranch?.id === b.id && <Icon source="check-circle" size={20} color={GREEN} />}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* HAKKINDA */}
            <Text style={s.section}>HAKKINDA</Text>
            <View style={s.card}>
                <View style={s.row}>
                    <Icon source="information-outline" size={20} color="#888" />
                    <Text style={s.rowLabel}>Uygulama Versiyonu</Text>
                    <Text style={s.rowValue}>1.0.0</Text>
                </View>
                <Divider />
                <View style={s.row}>
                    <Icon source="code-tags" size={20} color="#888" />
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
    card: { backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    rowLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    rowValue: { fontSize: 13, color: '#888', fontWeight: '600' },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2A7A5020', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 16, fontWeight: '800', color: '#2A7A50' },
    userName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    userEmail: { fontSize: 12, color: '#888', marginTop: 2 },
    roleBadge: { backgroundColor: '#6C63FF18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontSize: 10, fontWeight: '800', color: '#6C63FF' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, backgroundColor: '#E05C5C12', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E05C5C30' },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#E05C5C' },
});
