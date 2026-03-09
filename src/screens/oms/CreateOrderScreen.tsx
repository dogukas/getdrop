import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useToast } from '../../context/ToastContext';
import { createOrder } from '../../services/createService';

const GREEN = '#2A7A50';
type Props = NativeStackScreenProps<any, 'CreateOrder'>;

interface ItemForm { productName: string; sku: string; quantity: string; unitPrice: string; }

export default function CreateOrderScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadOrders = useDataStore(s => s.loadOrders);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [customer, setCustomer] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemForm[]>([
        { productName: '', sku: '', quantity: '1', unitPrice: '0' },
    ]);
    const [loading, setLoading] = useState(false);

    const addItem = () => setItems(prev => [...prev, { productName: '', sku: '', quantity: '1', unitPrice: '0' }]);
    const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ItemForm, val: string) =>
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

    const handleSave = async () => {
        if (!customer.trim() || !address.trim()) {
            Alert.alert('Hata', 'Müşteri adı ve adres zorunludur.'); return;
        }
        if (items.some(i => !i.productName.trim() || !i.sku.trim())) {
            Alert.alert('Hata', 'Tüm kalemlerin ürün adı ve SKU alanı dolu olmalıdır.'); return;
        }
        if (!activeBranch || !user) return;

        setLoading(true);
        try {
            const orderId = await createOrder({
                customer, address, notes: notes || undefined,
                branchId: activeBranch.id,
                createdBy: user.id,
                items: items.map(i => ({
                    productName: i.productName,
                    sku: i.sku,
                    quantity: parseInt(i.quantity) || 1,
                    unitPrice: parseFloat(i.unitPrice) || 0,
                })),
            });
            await addLog({
                level: 'success', title: 'Yeni Sipariş Oluşturuldu',
                description: `${customer} için sipariş oluşturuldu. ${items.length} kalem.`,
                module: 'OMS', entityId: orderId, user: user.name,
            });
            await loadOrders();
            showToast({ message: '✅ Sipariş oluşturuldu!', type: 'success' });
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Hata', e.message ?? 'Sipariş oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Text style={s.section}>MÜŞTERİ BİLGİSİ</Text>
                <View style={s.card}>
                    <TextInput mode="outlined" label="Müşteri Adı *" value={customer} onChangeText={setCustomer}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} />
                    <TextInput mode="outlined" label="Teslimat Adresi *" value={address} onChangeText={setAddress}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} multiline numberOfLines={2} />
                    <TextInput mode="outlined" label="Notlar (İsteğe Bağlı)" value={notes} onChangeText={setNotes}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} multiline />
                </View>

                <View style={s.sectionRow}>
                    <Text style={s.section}>KALEMLER</Text>
                    <TouchableOpacity style={s.addBtn} onPress={addItem}>
                        <Icon source="plus" size={16} color={GREEN} />
                        <Text style={s.addBtnText}>Kalem Ekle</Text>
                    </TouchableOpacity>
                </View>

                {items.map((item, i) => (
                    <View key={i} style={s.itemCard}>
                        <View style={s.itemHeader}>
                            <Text style={s.itemTitle}>Kalem {i + 1}</Text>
                            {items.length > 1 && (
                                <TouchableOpacity onPress={() => removeItem(i)}>
                                    <Icon source="trash-can-outline" size={18} color="#E05C5C" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput mode="outlined" label="Ürün Adı *" value={item.productName}
                            onChangeText={v => updateItem(i, 'productName', v)}
                            style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} />
                        <TextInput mode="outlined" label="SKU *" value={item.sku}
                            onChangeText={v => updateItem(i, 'sku', v)}
                            style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} autoCapitalize="none" />
                        <View style={s.row}>
                            <TextInput mode="outlined" label="Adet" value={item.quantity}
                                onChangeText={v => updateItem(i, 'quantity', v)}
                                style={[s.input, { flex: 1, marginRight: 8 }]} outlineColor="#E0E0E0" activeOutlineColor={GREEN}
                                keyboardType="numeric" />
                            <TextInput mode="outlined" label="Birim Fiyat (₺)" value={item.unitPrice}
                                onChangeText={v => updateItem(i, 'unitPrice', v)}
                                style={[s.input, { flex: 1 }]} outlineColor="#E0E0E0" activeOutlineColor={GREEN}
                                keyboardType="numeric" />
                        </View>
                    </View>
                ))}

                <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}
                    buttonColor={GREEN} style={s.saveBtn} contentStyle={{ height: 52 }}
                    labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                    {loading ? 'KAYDEDİLİYOR...' : 'SİPARİŞ OLUŞTUR'}
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
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${GREEN}18`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    addBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2 },
    itemCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    itemTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
    input: { backgroundColor: '#FFF', marginBottom: 10, fontSize: 14 },
    row: { flexDirection: 'row' },
    saveBtn: { marginTop: 24, borderRadius: 14 },
});
