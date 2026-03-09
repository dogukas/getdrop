import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    Animated, FlatList, StatusBar,
} from 'react-native';
import { Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        key: 'welcome',
        icon: 'warehouse',
        iconBg: '#2A7A50',
        bg: '#2A7A50',
        title: 'DepoSaaS\'e\nHoşgeldiniz',
        sub: 'Kurumsal lojistik yönetimini tek platformda birleştiren akıllı çözümünüz.',
    },
    {
        key: 'oms',
        icon: 'clipboard-list-outline',
        iconBg: '#2A7A50',
        bg: '#FFFFFF',
        title: 'Sipariş Yönetimi',
        sub: 'Tüm siparişlerinizi tek ekranda takip edin. Durumu anlık olarak güncelleyin.',
        dark: false,
    },
    {
        key: 'transfer',
        icon: 'swap-horizontal-bold',
        iconBg: '#6C63FF',
        bg: '#FFFFFF',
        title: 'Transfer Merkezi',
        sub: 'Depolar arası transferleri kolayca oluşturun ve onaylayın.',
        dark: false,
    },
    {
        key: 'stock',
        icon: 'package-variant-closed',
        iconBg: '#E8A020',
        bg: '#FFFFFF',
        title: 'Stok Takibi',
        sub: 'Kritik stokları anında görün. Minimum stok uyarılarıyla sürprizlere son.',
        dark: false,
    },
    {
        key: 'start',
        icon: 'rocket-launch-outline',
        iconBg: '#2A7A50',
        bg: '#2A7A50',
        title: 'Hazır mısınız?',
        sub: 'Hesabınıza giriş yaparak başlayın. Tüm verileriniz güvende.',
        dark: true,
    },
];

interface Props {
    onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatRef = useRef<FlatList>(null);
    const currentIdx = useRef(0);

    const handleNext = async (idx: number) => {
        if (idx < SLIDES.length - 1) {
            flatRef.current?.scrollToIndex({ index: idx + 1, animated: true });
        } else {
            await AsyncStorage.setItem('onboarding_done', '1');
            onDone();
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('onboarding_done', '1');
        onDone();
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor="#2A7A50" />

            <Animated.FlatList
                ref={flatRef}
                data={SLIDES}
                keyExtractor={item => item.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                onMomentumScrollEnd={e => {
                    currentIdx.current = Math.round(e.nativeEvent.contentOffset.x / width);
                }}
                renderItem={({ item, index }) => (
                    <SlideItem
                        item={item}
                        index={index}
                        total={SLIDES.length}
                        onNext={() => handleNext(index)}
                        onSkip={handleSkip}
                        isLast={index === SLIDES.length - 1}
                    />
                )}
            />

            {/* Dots */}
            <View style={s.dotsWrap}>
                {SLIDES.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
                    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
                    return (
                        <Animated.View key={i} style={[s.dot, { width: dotWidth, opacity }]} />
                    );
                })}
            </View>
        </View>
    );
}

function SlideItem({ item, index, total, onNext, onSkip, isLast }: any) {
    const isGreen = item.bg === '#2A7A50';
    const textColor = isGreen ? 'white' : '#1A1A1A';
    const subColor = isGreen ? 'rgba(255,255,255,0.8)' : '#666';

    return (
        <View style={[slide.root, { backgroundColor: item.bg }]}>
            {/* Dekoratif daireler */}
            {isGreen && (
                <>
                    <View style={[slide.bg1]} />
                    <View style={[slide.bg2]} />
                </>
            )}

            {/* Skip */}
            {!isLast && (
                <TouchableOpacity style={[slide.skip, isGreen && { backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={onSkip}>
                    <Text style={[slide.skipText, isGreen && { color: 'rgba(255,255,255,0.7)' }]}>Atla</Text>
                </TouchableOpacity>
            )}

            {/* İkon */}
            <View style={[slide.iconWrap, { backgroundColor: isGreen ? 'rgba(255,255,255,0.15)' : item.iconBg + '15' }]}>
                <View style={[slide.iconInner, { backgroundColor: isGreen ? 'rgba(255,255,255,0.2)' : item.iconBg + '25' }]}>
                    <Icon source={item.icon} size={56} color={isGreen ? 'white' : item.iconBg} />
                </View>
            </View>

            <Text style={[slide.title, { color: textColor }]}>{item.title}</Text>
            <Text style={[slide.sub, { color: subColor }]}>{item.sub}</Text>

            {/* Next Button */}
            <TouchableOpacity
                style={[slide.btn, isGreen
                    ? { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' }
                    : { backgroundColor: item.iconBg ?? '#2A7A50', shadowColor: item.iconBg ?? '#2A7A50' }
                ]}
                onPress={onNext}
                activeOpacity={0.85}
            >
                <Text style={[slide.btnText, { color: isGreen ? 'white' : 'white' }]}>
                    {isLast ? 'Giriş Yap' : 'İleri'}
                </Text>
                <Icon source={isLast ? 'login' : 'arrow-right'} size={20} color="white" />
            </TouchableOpacity>

            <Text style={[slide.counter, { color: isGreen ? 'rgba(255,255,255,0.4)' : '#CCC' }]}>{index + 1} / {total}</Text>
        </View>
    );
}

const slide = StyleSheet.create({
    root: {
        width, height, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 36, overflow: 'hidden',
    },
    bg1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -80 },
    bg2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 60, left: -60 },
    skip: { position: 'absolute', top: 54, right: 24, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
    skipText: { fontSize: 13, fontWeight: '600', color: '#888' },
    iconWrap: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
    iconInner: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 14, lineHeight: 36 },
    sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 48 },
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 16, paddingHorizontal: 36, borderRadius: 18,
        shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
    },
    btnText: { fontSize: 16, fontWeight: '800' },
    counter: { position: 'absolute', bottom: 44, fontSize: 12, fontWeight: '600' },
});

const s = StyleSheet.create({
    root: { flex: 1 },
    dotsWrap: { position: 'absolute', bottom: 80, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { height: 8, borderRadius: 4, backgroundColor: '#2A7A50' },
});
