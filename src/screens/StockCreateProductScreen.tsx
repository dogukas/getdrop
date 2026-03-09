import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { useActivityStore } from '../store/useActivityStore';
import { useToast } from '../context/ToastContext';
import { createProduct } from '../services/createService';

const GREEN = '#2A7A50';
type Props = NativeStackScreenProps<any, 'CreateProduct'>;

const UNITS = ['adet', 'kg', 'lt', 'm', 'm²', 'kutu', 'paket', 'koli'];

export default function CreateProductScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadProducts = useDataStore(s => s.loadProducts);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [stock, setStock] = useState('0');
    const [unit, setUnit] = useState('adet');
    const [minStock, setMinStock] = useState('10');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !sku.trim()) { Alert.alert('Hata', 'Ürün adı ve SKU zorunludur.'); return; }
        if (!activeBranch || !user) return;
        setLoading(true);
        try {
            await createProduct({
                name, sku, stock: parseInt(stock) || 0,
                unit, minStock: parseInt(minStock) || 10,
                branchId: activeBranch.id,
            });
            await addLog({
                level: 'success', title: 'Yeni Ürün Eklendi',
                description: `${name} (${sku}) stoka eklendi. Başlangıç stok: ${stock} ${unit}.`,
                module: 'Stok', user: user.name,
            });
            await loadProducts();
            showToast({ message: '✅ Ürün eklendi!', type: 'success' });
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Hata', e.message ?? 'Ürün eklenemedi.');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Text style={s.section}>ÜRÜN BİLGİSİ</Text>
                <View style={s.card}>
                    <TextInput mode="outlined" label="Ürün Adı *" value={name} onChangeText={setName}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} />
                    <TextInput mode="outlined" label="SKU (Stok Kodu) *" value={sku} onChangeText={setSku}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} autoCapitalize="none" />
                    <View style={s.row}>
                        <TextInput mode="outlined" label="Başlangıç Stok" value={stock}
                            onChangeText={setStock} style={[s.input, { flex: 1, marginRight: 8 }]}
                            outlineColor="#E0E0E0" activeOutlineColor={GREEN} keyboardType="numeric" />
                        <TextInput mode="outlined" label="Min Stok Uyarısı" value={minStock}
                            onChangeText={setMinStock} style={[s.input, { flex: 1 }]}
                            outlineColor="#E0E0E0" activeOutlineColor={GREEN} keyboardType="numeric" />
                    </View>

                    <Text style={s.label}>Birim</Text>
                    <View style={s.unitRow}>
                        {UNITS.map(u => (
                            <View key={u} style={[s.unitChip, unit === u && s.unitChipActive]}>
                                <Text
                                    style={[s.unitText, unit === u && s.unitTextActive]}
                                    onPress={() => setUnit(u)}
                                >{u}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}
                    buttonColor={GREEN} style={s.saveBtn} contentStyle={{ height: 52 }}
                    labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                    {loading ? 'KAYDEDİLİYOR...' : 'ÜRÜN EKLE'}
                </Button>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8' },
    scroll: { padding: 16 },
    section: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginTop: 16, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2 },
    input: { backgroundColor: '#FFF', marginBottom: 10, fontSize: 14 },
    row: { flexDirection: 'row' },
    label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, marginTop: 4 },
    unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    unitChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
    unitChipActive: { backgroundColor: `#2A7A5018`, borderColor: '#2A7A50' },
    unitText: { fontSize: 13, fontWeight: '600', color: '#666' },
    unitTextActive: { color: '#2A7A50', fontWeight: '700' },
    saveBtn: { marginTop: 24, borderRadius: 14 },
});
