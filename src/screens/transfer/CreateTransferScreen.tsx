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
import { createTransfer } from '../../services/createService';

const GREEN = '#2A7A50';
type Props = NativeStackScreenProps<any, 'CreateTransfer'>;

export default function CreateTransferScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadTransfers = useDataStore(s => s.loadTransfers);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [sourceWarehouse, setSourceWarehouse] = useState('');
    const [targetWarehouse, setTargetWarehouse] = useState('');
    const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ productName: '', sku: '', quantity: '1' }]);
    const [loading, setLoading] = useState(false);

    const addItem = () => setItems(p => [...p, { productName: '', sku: '', quantity: '1' }]);
    const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: string, val: string) =>
        setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

    const handleSave = async () => {
        if (!sourceWarehouse.trim() || !targetWarehouse.trim()) {
            Alert.alert('Hata', 'Kaynak ve hedef depo zorunludur.'); return;
        }
        if (!plannedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            Alert.alert('Hata', 'Tarih YYYY-AA-GG formatında olmalıdır.'); return;
        }
        if (items.some(i => !i.productName.trim() || !i.sku.trim())) {
            Alert.alert('Hata', 'Tüm kalemlerin ürün adı ve SKU alanı dolu olmalıdır.'); return;
        }
        if (!activeBranch || !user) return;

        setLoading(true);
        try {
            const id = await createTransfer({
                sourceWarehouse, targetWarehouse, plannedDate, notes: notes || undefined,
                branchId: activeBranch.id, createdBy: user.id,
                items: items.map(i => ({ productName: i.productName, sku: i.sku, quantity: parseInt(i.quantity) || 1 })),
            });
            await addLog({
                level: 'info', title: 'Yeni Transfer Oluşturuldu',
                description: `${sourceWarehouse} → ${targetWarehouse} transferi oluşturuldu.`,
                module: 'Transfer', entityId: id, user: user.name,
            });
            await loadTransfers();
            showToast({ message: '✅ Transfer oluşturuldu!', type: 'success' });
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Hata', e.message ?? 'Transfer oluşturulamadı.');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Text style={s.section}>DEPO BİLGİSİ</Text>
                <View style={s.card}>
                    <TextInput mode="outlined" label="Kaynak Depo *" value={sourceWarehouse} onChangeText={setSourceWarehouse}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} />
                    <TextInput mode="outlined" label="Hedef Depo *" value={targetWarehouse} onChangeText={setTargetWarehouse}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} />
                    <TextInput mode="outlined" label="Planlanan Tarih (YYYY-AA-GG) *" value={plannedDate} onChangeText={setPlannedDate}
                        style={s.input} outlineColor="#E0E0E0" activeOutlineColor={GREEN} keyboardType="numbers-and-punctuation" />
                    <TextInput mode="outlined" label="Notlar" value={notes} onChangeText={setNotes}
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
                        <View style={s.row}>
                            <TextInput mode="outlined" label="SKU *" value={item.sku}
                                onChangeText={v => updateItem(i, 'sku', v)}
                                style={[s.input, { flex: 2, marginRight: 8 }]} outlineColor="#E0E0E0" activeOutlineColor={GREEN} autoCapitalize="none" />
                            <TextInput mode="outlined" label="Adet" value={item.quantity}
                                onChangeText={v => updateItem(i, 'quantity', v)}
                                style={[s.input, { flex: 1 }]} outlineColor="#E0E0E0" activeOutlineColor={GREEN} keyboardType="numeric" />
                        </View>
                    </View>
                ))}

                <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}
                    buttonColor={GREEN} style={s.saveBtn} contentStyle={{ height: 52 }}
                    labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                    {loading ? 'KAYDEDİLİYOR...' : 'TRANSFERİ OLUŞTUR'}
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
