import React, { useState, useRef, useEffect } from 'react';
import {
    View, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
    Platform, StatusBar, Animated, Dimensions,
} from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const GREEN = '#2A7A50';
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    // Animasyonlar
    const logoAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(40)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const bubble1 = useRef(new Animated.Value(0)).current;
    const bubble2 = useRef(new Animated.Value(0)).current;
    const bubble3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
            Animated.spring(cardAnim, { toValue: 0, tension: 50, friction: 10, delay: 200, useNativeDriver: true }),
        ]).start();

        // Baloncuk animasyonları (loop)
        const loopBubble = (anim: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration: 3000 + delay * 500, useNativeDriver: true, delay }),
                    Animated.timing(anim, { toValue: 0, duration: 3000 + delay * 500, useNativeDriver: true }),
                ])
            ).start();
        };
        loopBubble(bubble1, 0);
        loopBubble(bubble2, 600);
        loopBubble(bubble3, 1200);
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !pass.trim()) {
            setError('Lütfen e-posta ve şifrenizi girin.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), pass);
        } catch (err: any) {
            const msg = typeof err === 'string' ? err : err?.message ?? '';
            if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
                setError('E-posta veya şifre hatalı.');
            } else if (msg.includes('Email not confirmed')) {
                setError('E-posta adresinizi doğrulamanız gerekiyor.');
            } else if (msg.includes('Too many requests')) {
                setError('Çok fazla deneme. Lütfen bekleyiniz.');
            } else {
                setError(msg || 'Giriş başarısız. Tekrar deneyin.');
            }
            setLoading(false);
        }
    };

    const b1Y = bubble1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
    const b2Y = bubble2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
    const b3Y = bubble3.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });

    return (
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={GREEN} />

            {/* Üst gradient arka plan */}
            <View style={s.topBg}>
                {/* Dekoratif balonlar */}
                <Animated.View style={[s.bubble, s.b1, { transform: [{ translateY: b1Y }] }]} />
                <Animated.View style={[s.bubble, s.b2, { transform: [{ translateY: b2Y }] }]} />
                <Animated.View style={[s.bubble, s.b3, { transform: [{ translateY: b3Y }] }]} />

                {/* Logo Alanı */}
                <Animated.View style={[s.logoArea, {
                    opacity: logoAnim,
                    transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }]
                }]}>
                    <View style={s.logoBox}>
                        <Icon source="warehouse" size={44} color="white" />
                    </View>
                    <Text style={s.appName}>DepoSaaS</Text>
                    <Text style={s.tagline}>Kurumsal Lojistik Yönetimi</Text>
                </Animated.View>
            </View>

            {/* Alt Form Kartı */}
            <Animated.View style={[s.card, {
                opacity: cardOpacity,
                transform: [{ translateY: cardAnim }]
            }]}>
                <Text style={s.formTitle}>Hesabınıza Giriş Yapın</Text>
                <Text style={s.formSub}>Devam etmek için bilgilerinizi girin</Text>

                {error ? (
                    <View style={s.errorBox}>
                        <Icon source="alert-circle" size={16} color="#E05C5C" />
                        <Text style={s.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Email Input */}
                <View style={s.inputWrap}>
                    <View style={s.inputIcon}>
                        <Icon source="email-outline" size={18} color={email ? GREEN : '#AAA'} />
                    </View>
                    <TextInput
                        mode="flat"
                        label="E-posta Adresi"
                        value={email}
                        onChangeText={(t) => { setEmail(t); setError(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        style={s.input}
                        onSubmitEditing={handleLogin}
                        returnKeyType="next"
                        theme={{ colors: { background: 'transparent' } }}
                    />
                </View>

                {/* Password Input */}
                <View style={s.inputWrap}>
                    <View style={s.inputIcon}>
                        <Icon source="lock-outline" size={18} color={pass ? GREEN : '#AAA'} />
                    </View>
                    <TextInput
                        mode="flat"
                        label="Şifre"
                        value={pass}
                        onChangeText={(t) => { setPass(t); setError(''); }}
                        secureTextEntry={!showPass}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        style={s.input}
                        onSubmitEditing={handleLogin}
                        returnKeyType="done"
                        theme={{ colors: { background: 'transparent' } }}
                    />
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                        <Icon source={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7}>
                    <Text style={s.forgotText}>Şifremi Unuttum</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                    style={[s.loginBtn, loading && { opacity: 0.75 }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Icon source="loading" size={20} color="white" />
                            <Text style={s.loginBtnText}>GİRİŞ YAPILIYOR...</Text>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={s.loginBtnText}>GİRİŞ YAP</Text>
                            <Icon source="arrow-right" size={20} color="white" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Info */}
                <View style={s.infoRow}>
                    <Icon source="shield-check-outline" size={13} color="#AAA" />
                    <Text style={s.infoText}>Verileriniz SSL ile şifrelenerek korunmaktadır.</Text>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },

    // Üst arka plan
    topBg: {
        backgroundColor: GREEN,
        paddingTop: 60, paddingBottom: 50,
        alignItems: 'center',
        overflow: 'hidden',
    },
    bubble: {
        position: 'absolute', borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    b1: { width: 180, height: 180, top: -60, left: -40 },
    b2: { width: 120, height: 120, top: 20, right: -20 },
    b3: { width: 80, height: 80, bottom: -20, right: 60 },

    logoArea: { alignItems: 'center', gap: 8 },
    logoBox: {
        width: 90, height: 90, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    appName: { fontSize: 30, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
    tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },

    // Alt form kartı
    card: {
        backgroundColor: '#FFF', borderRadius: 32,
        marginHorizontal: 16, marginTop: -24,
        padding: 28, paddingTop: 32,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    },
    formTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
    formSub: { fontSize: 13, color: '#AAA', marginBottom: 24 },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FDECEA', padding: 12, borderRadius: 12, marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#E05C5C', fontWeight: '600', flex: 1 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F7F7F7', borderRadius: 16,
        paddingHorizontal: 14, marginBottom: 12,
        borderWidth: 1.5, borderColor: '#F0F0F0',
    },
    inputIcon: { marginRight: 8, marginTop: 8 },
    input: {
        flex: 1, backgroundColor: 'transparent',
        fontSize: 14, height: 54,
    },
    eyeBtn: { padding: 8, marginTop: 8 },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
    forgotText: { fontSize: 13, fontWeight: '600', color: GREEN },

    loginBtn: {
        backgroundColor: GREEN, borderRadius: 16,
        paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
        shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    loginBtnText: { fontSize: 15, fontWeight: '800', color: 'white', letterSpacing: 0.8 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, justifyContent: 'center' },
    infoText: { fontSize: 11, color: '#CCC' },
});
