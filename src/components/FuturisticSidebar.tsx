import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions, Switch, Modal
} from 'react-native';
import { Text, Icon, Portal } from 'react-native-paper';
import { useSidebar } from '../context/SidebarContext';
import { useAppStore, ROLE_LABELS } from '../store/useAppStore';
import { navRef } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.76;
const GREEN = '#2A7A50';

// ── Tip tanımları ────────────────────────────────────────
interface MenuItem {
    key: string;
    label: string;
    icon: string;
    screen?: string;
    badge?: number;
    badgeColor?: string;
}
interface MenuGroup {
    title: string;
    items: MenuItem[];
}

// ── Menü yapısı ──────────────────────────────────────────
function buildMenu(unread: number): MenuGroup[] {
    return [
        {
            title: 'OPERASYONLAR',
            items: [
                { key: 'Home', label: 'Dashboard', icon: 'view-dashboard-outline', screen: 'Home' },
                { key: 'OMS', label: 'OMS', icon: 'clipboard-list-outline', screen: 'OMS', badge: 8, badgeColor: GREEN },
                { key: 'Transfer', label: 'Transfer Merkezi', icon: 'swap-horizontal-bold', screen: 'Transfer', badge: 3, badgeColor: '#6C63FF' },
                { key: 'Sevkiyat', label: 'Sevkiyat Kabul', icon: 'truck-check-outline', screen: 'Sevkiyat', badge: 2, badgeColor: '#E8A020' },
            ],
        },
        {
            title: 'STOK & DEPO',
            items: [
                { key: 'Stock', label: 'Stok Takip', icon: 'package-variant-closed-check', screen: 'Stock' },
                { key: 'Warehouse', label: 'Depo Yönetimi', icon: 'warehouse', screen: 'Warehouse' },
            ],
        },
        {
            title: 'ANALİZ',
            items: [
                { key: 'Reports', label: 'Raporlar', icon: 'chart-bar', screen: 'Reports' },
                { key: 'Alerts', label: 'Bildirimler', icon: 'bell-outline', screen: 'Notifications', badge: unread, badgeColor: '#E05C5C' },
            ],
        },
    ];
}

// ── Props ─────────────────────────────────────────────────
interface Props {
    currentRoute: string;
    onNavigate: (route: string) => void;
}

// ── Sidebar Bileşeni ──────────────────────────────────────
export default function SidebarPanel({ currentRoute, onNavigate }: Props) {
    const { isOpen, closeSidebar } = useSidebar();
    const { user, isDarkMode, toggleTheme, unreadCount, branches, activeBranch, setActiveBranch } = useAppStore();
    const [branchModalOpen, setBranchModalOpen] = useState(false);

    const menuGroups = buildMenu(unreadCount);

    function navigate(screen?: string) {
        if (!screen) return;
        onNavigate(screen);
        closeSidebar();
    }

    const roleLabel = user?.role ? ROLE_LABELS[user.role] : '';
    const ROLE_COLORS = { admin: '#6C63FF', operator: GREEN, viewer: '#888' };
    const roleColor = user?.role ? ROLE_COLORS[user.role] : '#888';

    return (
        <View style={s.panel}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ── Profil Bölümü ─── */}
                <View style={s.profile}>
                    <View style={s.avatarWrap}>
                        <View style={s.avatar}>
                            <Text style={s.avatarText}>{user?.name?.slice(0, 2).toUpperCase() ?? '👤'}</Text>
                        </View>
                        {/* Online dot */}
                        <View style={s.onlineDot} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.userName} numberOfLines={1}>{user?.name ?? 'Kullanıcı'}</Text>
                        <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
                        <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                            <View style={[s.roleDot, { backgroundColor: roleColor }]} />
                            <Text style={[s.roleText, { color: roleColor }]}>{roleLabel}</Text>
                        </View>
                    </View>
                    {/* Kapat X */}
                    <TouchableOpacity onPress={closeSidebar} style={s.closeBtn} activeOpacity={0.7}>
                        <Icon source="close" size={18} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                {/* ── Şube (Tenant) Seçici ─── */}
                <View style={s.branchSection}>
                    <Text style={s.branchLabel}>AKTİF ŞUBE</Text>
                    <TouchableOpacity style={s.branchSelector} onPress={() => setBranchModalOpen(true)} activeOpacity={0.8}>
                        <View style={s.branchIconWrap}>
                            <Icon source="domain" size={16} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.branchName} numberOfLines={1}>{activeBranch?.name}</Text>
                        </View>
                        <Icon source="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                {/* ── Menü Grupları ─── */}
                {menuGroups.map((group) => (
                    <View key={group.title} style={s.group}>
                        <Text style={s.groupTitle}>{group.title}</Text>
                        {group.items.map((item) => {
                            const active = currentRoute === item.key || currentRoute === item.screen;
                            const showBadge = !!item.badge && item.badge > 0;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[s.menuItem, active && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
                                    onPress={() => navigate(item.screen)}
                                    activeOpacity={0.7}
                                >
                                    {/* Sol aktif çizgi */}
                                    {active && <View style={s.activeIndicator} />}

                                    <View style={[s.iconBox, active && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                        <Icon source={item.icon} size={19} color={active ? 'white' : 'rgba(255,255,255,0.7)'} />
                                    </View>

                                    <Text style={[s.menuLabel, active && s.menuLabelActive]}>
                                        {item.label}
                                    </Text>

                                    {showBadge && (
                                        <View style={[s.badge, { backgroundColor: item.badgeColor }]}>
                                            <Text style={s.badgeText}>{item.badge}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                {/* ── Ayarlar grupları ─── */}
                <View style={s.bottomGroup}>
                    {/* Tema toggle */}
                    <View style={s.themeRow}>
                        <Icon source={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={s.themeLabel}>{isDarkMode ? 'Karanlık Mod' : 'Aydınlık Mod'}</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.5)' }}
                            thumbColor="white"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>

                    {/* Ayarlar */}
                    <TouchableOpacity style={s.menuItem} onPress={() => navigate('Settings')} activeOpacity={0.7}>
                        <View style={s.iconBox}>
                            <Icon source="cog-outline" size={19} color="rgba(255,255,255,0.7)" />
                        </View>
                        <Text style={s.menuLabel}>Ayarlar</Text>
                    </TouchableOpacity>

                    {/* Çıkış */}
                    <TouchableOpacity style={[s.menuItem, { marginTop: 4 }]} onPress={closeSidebar} activeOpacity={0.7}>
                        <View style={[s.iconBox, { backgroundColor: 'rgba(224,92,92,0.2)' }]}>
                            <Icon source="logout" size={19} color="#E05C5C" />
                        </View>
                        <Text style={[s.menuLabel, { color: '#E05C5C' }]}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Versiyon ─── */}
                <View style={s.versionRow}>
                    <Text style={s.versionText}>DepoSaaS v1.0.0 · 2024</Text>
                </View>
            </ScrollView>

            {/* Şube Seçim Modalı */}
            <Modal visible={branchModalOpen} transparent animationType="fade" onRequestClose={() => setBranchModalOpen(false)}>
                <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setBranchModalOpen(false)}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Şube Değiştir</Text>
                            <TouchableOpacity onPress={() => setBranchModalOpen(false)}>
                                <Icon source="close" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                        {branches.map(b => (
                            <TouchableOpacity
                                key={b.id}
                                style={[s.branchListItem, activeBranch?.id === b.id && s.branchListActive]}
                                onPress={() => { setActiveBranch(b); setBranchModalOpen(false); }}
                            >
                                <Icon source="domain" size={20} color={activeBranch?.id === b.id ? GREEN : '#888'} />
                                <Text style={[s.branchListText, activeBranch?.id === b.id && { color: GREEN, fontWeight: '700' }]}>
                                    {b.name}
                                </Text>
                                {activeBranch?.id === b.id && <Icon source="check" size={20} color={GREEN} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ── Stiller ───────────────────────────────────────────────
const s = StyleSheet.create({
    panel: {
        position: 'absolute', top: 0, left: 0,
        width: SIDEBAR_WIDTH, height: '100%',
        backgroundColor: GREEN,
        zIndex: 0,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
    },
    scroll: { paddingTop: 56, paddingBottom: 32 },

    /* Profil */
    profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
    avatarWrap: { position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 17, fontWeight: '800', color: 'white' },
    onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: GREEN },
    userName: { fontSize: 14, fontWeight: '700', color: 'white' },
    userEmail: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
    roleDot: { width: 6, height: 6, borderRadius: 3 },
    roleText: { fontSize: 10, fontWeight: '700' },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

    /* Şube Seçici */
    branchSection: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
    branchLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
    branchSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    branchIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    branchName: { fontSize: 13, fontWeight: '700', color: 'white' },

    /* Gruplar */
    group: { paddingHorizontal: 16, paddingTop: 16 },
    groupTitle: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 6, marginLeft: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 14, position: 'relative', overflow: 'hidden' },
    activeIndicator: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: 'white' },
    iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
    menuLabelActive: { fontWeight: '700', color: 'white' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, minWidth: 24, alignItems: 'center' },
    badgeText: { fontSize: 11, fontWeight: '800', color: 'white' },

    /* Alt grup */
    bottomGroup: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 12 },
    themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8, marginBottom: 4 },
    themeLabel: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)' },

    /* Versiyon */
    versionRow: { alignItems: 'center', marginTop: 20, paddingBottom: 10 },
    versionText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    branchListItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8, backgroundColor: '#F8F8F8' },
    branchListActive: { backgroundColor: `${GREEN}12`, borderColor: `${GREEN}40`, borderWidth: 1 },
    branchListText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' }
});
