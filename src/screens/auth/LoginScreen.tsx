import React, { useState } from 'react';
import {
    View, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
    Platform, ScrollView, Animated, StatusBar,
} from 'react-native';
import { Text, TextInput, Button, Icon } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const GREEN = '#2A7A50';

export default function LoginScreen() {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async () => {
        if (!email || !pass) {
            setError('Lütfen e-posta ve şifrenizi girin.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await login(email, pass);
            // Başarılı olursa AppNavigator otomatiK olarak MainStack'e geçecek
        } catch (err: any) {
            setError(err || 'Giriş başarısız oldu.');
            setLoading(false);
        }
    };

    const autoFill = (e: string) => {
        setEmail(e);
        setPass('1234');
        setError('');
    };

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Üst Kısım Logo / Başlık */}
                <View style={s.header}>
                    <View style={s.logoBox}>
                        <Icon source="warehouse" size={40} color="white" />
                    </View>
                    <Text style={s.title}>DepoSaaS</Text>
                    <Text style={s.subtitle}>Kurumsal Lojistik Yönetimi</Text>
                </View>

                {/* Form Alanı */}
                <View style={s.card}>
                    <Text style={s.formTitle}>Hesabınıza Giriş Yapın</Text>

                    {error ? (
                        <View style={s.errorBox}>
                            <Icon source="alert-circle" size={16} color="#E05C5C" />
                            <Text style={s.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TextInput
                        mode="outlined"
                        label="E-posta Adresi"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        outlineColor="#E0E0E0"
                        activeOutlineColor={GREEN}
                        style={s.input}
                        left={<TextInput.Icon icon="email-outline" color="#888" />}
                    />

                    <TextInput
                        mode="outlined"
                        label="Şifre"
                        value={pass}
                        onChangeText={setPass}
                        secureTextEntry={!showPass}
                        outlineColor="#E0E0E0"
                        activeOutlineColor={GREEN}
                        style={s.input}
                        left={<TextInput.Icon icon="lock-outline" color="#888" />}
                        right={<TextInput.Icon icon={showPass ? "eye-off" : "eye"} onPress={() => setShowPass(!showPass)} />}
                    />

                    <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7}>
                        <Text style={s.forgotText}>Şifremi Unuttum</Text>
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        buttonColor={GREEN}
                        style={s.loginBtn}
                        contentStyle={{ height: 52 }}
                        labelStyle={{ fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}
                    >
                        {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
                    </Button>

                </View>

                {/* Demo Hesapları (Test İçin Kolaylık) */}
                <Text style={s.demoTitle}>Hızlı Test Hesapları (Şifre: 1234)</Text>
                <View style={s.demoRow}>
                    <TouchableOpacity style={s.demoChip} onPress={() => autoFill('admin@depo.com')}>
                        <Icon source="shield-account" size={14} color="#6C63FF" />
                        <Text style={s.demoText}>Admin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.demoChip} onPress={() => autoFill('op@depo.com')}>
                        <Icon source="account-hard-hat" size={14} color={GREEN} />
                        <Text style={s.demoText}>Operatör</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.demoChip} onPress={() => autoFill('misafir@depo.com')}>
                        <Icon source="eye" size={14} color="#E8A020" />
                        <Text style={s.demoText}>Viewer</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

    header: { alignItems: 'center', marginBottom: 40 },
    logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#666', marginTop: 4, letterSpacing: 1 },

    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
    formTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },

    input: { backgroundColor: '#FFF', marginBottom: 14, fontSize: 15 },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, paddingVertical: 4 },
    forgotText: { fontSize: 13, fontWeight: '600', color: GREEN },
    loginBtn: { borderRadius: 12 },

    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', padding: 12, borderRadius: 10, gap: 8, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#E05C5C', fontWeight: '600', flex: 1 },

    demoTitle: { fontSize: 12, fontWeight: '600', color: '#888', textAlign: 'center', marginTop: 40, marginBottom: 12 },
    demoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    demoChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    demoText: { fontSize: 12, fontWeight: '600', color: '#555' },
});
