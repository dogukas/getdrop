import React, { useState, useRef, useEffect } from 'react';
import {
    Animated, View, StyleSheet, Dimensions,
    TouchableOpacity, TouchableWithoutFeedback, StatusBar,
} from 'react-native';
import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OMSScreen from '../screens/oms/OMSScreen';
import OMSDetailScreen from '../screens/oms/OMSDetailScreen';
import TransferScreen from '../screens/transfer/TransferScreen';
import TransferDetailScreen from '../screens/transfer/TransferDetailScreen';
import SevkiyatScreen from '../screens/sevkiyat/SevkiyatScreen';
import SevkiyatDetailScreen from '../screens/sevkiyat/SevkiyatDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StockScreen from '../screens/StockScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import CreateOrderScreen from '../screens/oms/CreateOrderScreen';
import CreateTransferScreen from '../screens/transfer/CreateTransferScreen';
import CreateShipmentScreen from '../screens/sevkiyat/CreateShipmentScreen';
import CreateProductScreen from '../screens/StockCreateProductScreen';

import { useAuth } from '../context/AuthContext';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import SidebarPanel from '../components/FuturisticSidebar';

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef<any>();
export { navRef };

/* ── Hamburger Butonu ──────────────────────────────────── */
function HamburgerButton() {
    const { isOpen, toggleSidebar } = useSidebar();
    const rot = useRef(new Animated.Value(0)).current;
    const mid = useRef(new Animated.Value(1)).current;

    const toggle = () => {
        const to = !isOpen;
        Animated.parallel([
            Animated.timing(rot, { toValue: to ? 1 : 0, duration: 220, useNativeDriver: true }),
            Animated.timing(mid, { toValue: to ? 0 : 1, duration: 180, useNativeDriver: true }),
        ]).start();
        toggleSidebar();
    };

    const r1 = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
    const r3 = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] });
    const LINE = { width: 22, height: 2, backgroundColor: '#1A1A1A', borderRadius: 2 };

    return (
        <TouchableOpacity onPress={toggle} style={hb.btn} activeOpacity={0.7}>
            <Animated.View style={[LINE, { transform: [{ rotate: r1 }], marginBottom: -2 }]} />
            <Animated.View style={[LINE, { opacity: mid }]} />
            <Animated.View style={[LINE, { transform: [{ rotate: r3 }], marginTop: -2 }]} />
        </TouchableOpacity>
    );
}
const hb = StyleSheet.create({ btn: { paddingHorizontal: 16, paddingVertical: 10, gap: 5 } });

/* ── Main App Layout (Sidebar + Stack) ─────────────────── */
function MainAppLayout({
    currentRoute,
    setCurrentRoute,
}: {
    currentRoute: string;
    setCurrentRoute: (r: string) => void;
}) {
    const { isOpen, closeSidebar } = useSidebar();

    // Tüm animasyonlar aynı driver'da = tam senkron
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const txAnim = useRef(new Animated.Value(0)).current;
    const brAnim = useRef(new Animated.Value(0)).current;

    const SPRING_OPEN = { tension: 45, friction: 8, useNativeDriver: false };
    const SPRING_CLOSE = { tension: 65, friction: 10, useNativeDriver: false };

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 0.82, ...SPRING_OPEN }),
                Animated.spring(txAnim, { toValue: width * 0.65, ...SPRING_OPEN }),
                Animated.spring(brAnim, { toValue: 28, ...SPRING_OPEN }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, ...SPRING_CLOSE }),
                Animated.spring(txAnim, { toValue: 0, ...SPRING_CLOSE }),
                Animated.spring(brAnim, { toValue: 0, ...SPRING_CLOSE }),
            ]).start();
        }
    }, [isOpen]);

    function navigateTo(route: string) {
        if (navRef.isReady()) {
            navRef.navigate(route as never);
            setCurrentRoute(route);
        }
    }

    return (
        <View style={sl.root}>
            <StatusBar barStyle="light-content" backgroundColor="#2A7A50" />

            {/* ── Sidebar paneli (her zaman arkada) ── */}
            <SidebarPanel currentRoute={currentRoute} onNavigate={navigateTo} />

            {/* ── Ana içerik (scale + slide efekti) ── */}
            <Animated.View
                style={[sl.mainOuter, { transform: [{ translateX: txAnim }, { scale: scaleAnim }] }]}
            >
                {/* borderRadius ayrı bir iç view'da (native driver uyumsuzluğu için) */}
                <Animated.View style={[sl.mainInner, { borderRadius: brAnim }]}>
                    <Stack.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            animation: 'slide_from_right',
                            headerStyle: { backgroundColor: '#FFFFFF' },
                            headerTitleStyle: { color: '#1A1A1A', fontWeight: '700', fontSize: 16 },
                            headerTintColor: '#1A1A1A',
                            headerShadowVisible: false,
                            headerLeft: () => <HamburgerButton />,
                            contentStyle: { backgroundColor: '#F4F6F8' },
                        }}
                    >
                        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa', headerLeft: () => <HamburgerButton /> }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', headerLeft: () => <HamburgerButton /> }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar', headerLeft: () => <HamburgerButton /> }} />
                        <Stack.Screen name="OMS" component={OMSScreen} options={{ title: 'OMS — Siparişler' }} />
                        <Stack.Screen name="OMSDetail" component={OMSDetailScreen} options={{ title: 'Sipariş Detayı' }} />
                        <Stack.Screen name="Transfer" component={TransferScreen} options={{ title: 'Transfer Merkezi' }} />
                        <Stack.Screen name="TransferDetail" component={TransferDetailScreen} options={{ title: 'Transfer Detayı' }} />
                        <Stack.Screen name="Sevkiyat" component={SevkiyatScreen} options={{ title: 'Sevkiyat Kabul' }} />
                        <Stack.Screen name="SevkiyatDetail" component={SevkiyatDetailScreen} options={{ title: 'Sevkiyat Detayı' }} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
                        <Stack.Screen name="Stock" component={StockScreen} options={{ title: 'Stok Takip' }} />
                        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar & Analiz' }} />
                        {/* Admin-only create screens */}
                        <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: 'Yeni Sipariş', headerShown: true, headerBackTitle: 'Geri' }} />
                        <Stack.Screen name="CreateTransfer" component={CreateTransferScreen} options={{ title: 'Yeni Transfer', headerShown: true, headerBackTitle: 'Geri' }} />
                        <Stack.Screen name="CreateShipment" component={CreateShipmentScreen} options={{ title: 'Yeni Sevkiyat', headerShown: true, headerBackTitle: 'Geri' }} />
                        <Stack.Screen name="CreateProduct" component={CreateProductScreen} options={{ title: 'Ürün Ekle', headerShown: true, headerBackTitle: 'Geri' }} />
                    </Stack.Navigator>

                    {/* Overlay karartma: derinlik hissi */}
                    {isOpen && (
                        <TouchableWithoutFeedback onPress={closeSidebar}>
                            <View style={StyleSheet.absoluteFillObject} />
                        </TouchableWithoutFeedback>
                    )}
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const sl = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#2A7A50' },
    mainOuter: {
        ...StyleSheet.absoluteFillObject,
        // Gölge: küçüldüğünde derinlik hissi verir
        shadowColor: '#000',
        shadowOffset: { width: -6, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 16,
    },
    mainInner: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
});

/* ── Root Navigator ────────────────────────────────────── */
export default function AppNavigator() {
    const [currentRoute, setCurrentRoute] = useState('Home');
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1A5C3A', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle="light-content" backgroundColor="#1A5C3A" />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navRef} onStateChange={(state) => {
            if (state) {
                const name = (state.routes[state.index] as any)?.name;
                if (name) setCurrentRoute(name);
            }
        }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    // ── Auth Stack ──
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    // ── Main App Stack ──
                    <Stack.Screen name="Main">
                        {() => (
                            <SidebarProvider>
                                <MainAppLayout
                                    currentRoute={currentRoute}
                                    setCurrentRoute={setCurrentRoute}
                                />
                            </SidebarProvider>
                        )}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
