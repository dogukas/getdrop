import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useToast } from '../../context/ToastContext';
import { createTransfer } from '../../services/createService';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';
type Props = NativeStackScreenProps<any, 'CreateTransfer'>;

const STEPS = ['Depo Bilgisi', 'Kalemler', 'Özet'];

function StepBar({ step, total }: { step: number; total: number }) {
    return (
        <View style={sb.wrap}>
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <View style={[sb.dot, i <= step && { backgroundColor: PURPLE, borderColor: PURPLE }]}>
                        {i < step
                            ? <Icon source="check" size={12} color="white" />
                            : <Text style={[sb.num, i === step && { color: 'white' }]}>{i + 1}</Text>
                        }
                    </View>
                    {i < total - 1 && <View style={[sb.line, i < step && { backgroundColor: PURPLE }]} />}
                </React.Fragment>
            ))}
        </View>
    );
}
const sb = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#DDD', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    line: { flex: 1, height: 2, backgroundColor: '#DDD', marginHorizontal: 4 },
    num: { fontSize: 12, fontWeight: '800', color: '#CCC' },
});

export default function CreateTransferScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadTransfers = useDataStore(s => s.loadTransfers);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
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

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (step === 0) {
            if (!sourceWarehouse.trim()) e.source = 'Kaynak depo zorunludur.';
            if (!targetWarehouse.trim()) e.target = 'Hedef depo zorunludur.';
            if (sourceWarehouse && targetWarehouse && sourceWarehouse === targetWarehouse)
                e.target = 'Kaynak ve hedef depo aynı olamaz.';
            if (!plannedDate.match(/^\d{4}-\d{2}-\d{2}$/)) e.date = 'Geçerli tarih giriniz (YYYY-AA-GG).';
        }
        if (step === 1) {
            items.forEach((it, i) => {
                if (!it.productName.trim()) e[`name_${i}`] = 'Ürün adı zorunlu.';
                if (!it.sku.trim()) e[`sku_${i}`] = 'SKU zorunlu.';
            });
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate()) setStep(s => s + 1); };
    const back = () => setStep(s => s - 1);

    const totalQty = items.reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);

    const handleSave = async () => {
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
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.stepContainer}>
                <Text style={s.stepLabel}>{STEPS[step]}</Text>
                <StepBar step={step} total={STEPS.length} />
                <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Step 0: Depo */}
                {step === 0 && (
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={[s.cardIcon, { backgroundColor: `${PURPLE}15` }]}>
                                <Icon source="warehouse" size={20} color={PURPLE} />
                            </View>
                            <Text style={s.cardTitle}>Depo Bilgisi</Text>
                        </View>

                        {/* Route visual */}
                        <View style={s.routeViz}>
                            <View style={[s.routeDot, { backgroundColor: PURPLE }]} />
                            <View style={s.routeLine} />
                            <Icon source="truck-outline" size={22} color={PURPLE} />
                            <View style={s.routeLine} />
                            <View style={[s.routeDot, { backgroundColor: GREEN }]} />
                        </View>

                        <FieldInput label="Kaynak Depo *" value={sourceWarehouse} onChangeText={v => { setSourceWarehouse(v); setErrors(e => ({ ...e, source: '' })); }} error={errors.source} icon="warehouse" accentColor={PURPLE} />
                        <FieldInput label="Hedef Depo *" value={targetWarehouse} onChangeText={v => { setTargetWarehouse(v); setErrors(e => ({ ...e, target: '' })); }} error={errors.target} icon="domain" accentColor={GREEN} />
                        <FieldInput label="Planlanan Tarih (YYYY-AA-GG)" value={plannedDate} onChangeText={v => { setPlannedDate(v); setErrors(e => ({ ...e, date: '' })); }} error={errors.date} icon="calendar-outline" keyboardType="numbers-and-punctuation" accentColor={PURPLE} />
                        <FieldInput label="Notlar" value={notes} onChangeText={setNotes} icon="information-outline" multiline accentColor={PURPLE} />
                    </View>
                )}

                {/* Step 1: Kalemler */}
                {step === 1 && (
                    <View>
                        <View style={s.sectionRow}>
                            <Text style={s.sectionLabel}>TRANSFER KALEMLERİ</Text>
                            <TouchableOpacity style={[s.addBtn, { backgroundColor: `${PURPLE}12` }]} onPress={addItem}>
                                <Icon source="plus-circle-outline" size={16} color={PURPLE} />
                                <Text style={[s.addBtnText, { color: PURPLE }]}>Kalem Ekle</Text>
                            </TouchableOpacity>
                        </View>
                        {items.map((item, i) => (
                            <View key={i} style={s.itemCard}>
                                <View style={s.itemHeader}>
                                    <View style={[s.itemNum, { backgroundColor: `${PURPLE}12` }]}>
                                        <Text style={[s.itemNumText, { color: PURPLE }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.itemTitle}>Kalem {i + 1}</Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(i)} style={s.removeBtn}>
                                            <Icon source="trash-can-outline" size={16} color="#E05C5C" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <FieldInput label="Ürün Adı *" value={item.productName} onChangeText={v => { updateItem(i, 'productName', v); setErrors(e => ({ ...e, [`name_${i}`]: '' })); }} error={errors[`name_${i}`]} icon="package-variant" accentColor={PURPLE} />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 2 }}>
                                        <FieldInput label="SKU *" value={item.sku} onChangeText={v => { updateItem(i, 'sku', v); setErrors(e => ({ ...e, [`sku_${i}`]: '' })); }} error={errors[`sku_${i}`]} icon="barcode" autoCapitalize="none" accentColor={PURPLE} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <FieldInput label="Adet" value={item.quantity} onChangeText={v => updateItem(i, 'quantity', v)} icon="counter" keyboardType="numeric" accentColor={PURPLE} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Step 2: Özet */}
                {step === 2 && (
                    <View>
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={[s.cardIcon, { backgroundColor: `${PURPLE}15` }]}>
                                    <Icon source="check-circle-outline" size={20} color={PURPLE} />
                                </View>
                                <Text style={s.cardTitle}>Transfer Özeti</Text>
                            </View>
                            {/* Route summary */}
                            <View style={s.routeSummary}>
                                <View style={s.routeStation}>
                                    <View style={[s.routeDot, { backgroundColor: PURPLE, width: 10, height: 10 }]} />
                                    <Text style={s.routeStationLabel}>Kaynak</Text>
                                    <Text style={s.routeStationName}>{sourceWarehouse}</Text>
                                </View>
                                <Icon source="truck-outline" size={24} color="#CCC" />
                                <View style={[s.routeStation, { alignItems: 'flex-end' }]}>
                                    <View style={[s.routeDot, { backgroundColor: GREEN, width: 10, height: 10 }]} />
                                    <Text style={s.routeStationLabel}>Hedef</Text>
                                    <Text style={s.routeStationName}>{targetWarehouse}</Text>
                                </View>
                            </View>
                            <SummaryRow icon="calendar-outline" label="Planlanan Tarih" value={plannedDate} color={PURPLE} />
                            {notes ? <SummaryRow icon="information-outline" label="Not" value={notes} color="#E8A020" /> : null}
                        </View>
                        <View style={[s.card, { marginTop: 10 }]}>
                            <Text style={s.summarySection}>KALEMLER ({items.length} adet · Toplam {totalQty} ürün)</Text>
                            {items.map((it, i) => (
                                <View key={i} style={s.summaryItem}>
                                    <View>
                                        <Text style={s.summaryItemName}>{it.productName}</Text>
                                        <Text style={s.summaryItemSku}>{it.sku}</Text>
                                    </View>
                                    <View style={[s.qtyBadge, { backgroundColor: `${PURPLE}12` }]}>
                                        <Text style={[s.qtyText, { color: PURPLE }]}>{it.quantity} adet</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={s.navBar}>
                {step > 0 ? (
                    <TouchableOpacity style={s.backBtn} onPress={back} activeOpacity={0.8}>
                        <Icon source="arrow-left" size={18} color="#666" />
                        <Text style={s.backBtnText}>Geri</Text>
                    </TouchableOpacity>
                ) : <View style={{ flex: 1 }} />}
                {step < STEPS.length - 1 ? (
                    <TouchableOpacity style={[s.nextBtn, { backgroundColor: PURPLE, shadowColor: PURPLE }]} onPress={next} activeOpacity={0.85}>
                        <Text style={s.nextBtnText}>İleri</Text>
                        <Icon source="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[s.nextBtn, { backgroundColor: PURPLE, shadowColor: PURPLE }, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
                        <Icon source={loading ? "loading" : "check"} size={18} color="white" />
                        <Text style={s.nextBtnText}>{loading ? 'Kaydediliyor...' : 'Transferi Oluştur'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

function FieldInput({ label, value, onChangeText, error, icon, multiline, autoCapitalize, keyboardType, accentColor = GREEN }: any) {
    return (
        <View style={fi.wrap}>
            <View style={[fi.inputBox, error && { borderColor: '#E05C5C', borderWidth: 1.5 }]}>
                <View style={fi.iconWrap}>
                    <Icon source={icon} size={16} color={value ? accentColor : '#AAA'} />
                </View>
                <TextInput mode="flat" label={label} value={value} onChangeText={onChangeText}
                    underlineColor="transparent" activeUnderlineColor="transparent"
                    style={fi.input} multiline={multiline} autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType} theme={{ colors: { background: 'transparent' } }} />
            </View>
            {error ? <Text style={fi.error}>{error}</Text> : null}
        </View>
    );
}
const fi = StyleSheet.create({
    wrap: { marginBottom: 10 },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: 14, borderWidth: 1, borderColor: '#EAEAEA', paddingLeft: 10 },
    iconWrap: { marginTop: 6 },
    input: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },
    error: { fontSize: 11, color: '#E05C5C', marginTop: 3, marginLeft: 4 },
});

function SummaryRow({ icon, label, value, color }: any) {
    return (
        <View style={srow.row}>
            <View style={[srow.icon, { backgroundColor: color + '12' }]}>
                <Icon source={icon} size={14} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={srow.label}>{label}</Text>
                <Text style={srow.value}>{value}</Text>
            </View>
        </View>
    );
}
const srow = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    label: { fontSize: 10, color: '#AAA', fontWeight: '700' },
    value: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 1 },
});

const s = StyleSheet.create({
    stepContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingTop: 8 },
    stepLabel: { fontSize: 13, fontWeight: '700', color: '#666', textAlign: 'center', marginBottom: 4 },
    progressBg: { height: 3, backgroundColor: '#F0F0F0' },
    progressFill: { height: '100%' as any, backgroundColor: PURPLE, borderRadius: 2 },
    scroll: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    routeViz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginBottom: 14, backgroundColor: '#F9F9FF', borderRadius: 14 },
    routeDot: { width: 12, height: 12, borderRadius: 6 },
    routeLine: { flex: 1, height: 2, backgroundColor: '#DDD' },
    routeSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9F9FF', borderRadius: 14, padding: 14, marginBottom: 14 },
    routeStation: { gap: 4 },
    routeStationLabel: { fontSize: 10, color: '#AAA', fontWeight: '700' },
    routeStationName: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
    addBtnText: { fontSize: 12, fontWeight: '700' },
    itemCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    itemNum: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    itemNumText: { fontSize: 12, fontWeight: '800' },
    itemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    removeBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#E05C5C10', alignItems: 'center', justifyContent: 'center' },
    summarySection: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginBottom: 12 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    summaryItemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    summaryItemSku: { fontSize: 11, color: '#AAA', marginTop: 2 },
    qtyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    qtyText: { fontSize: 12, fontWeight: '800' },
    navBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    backBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F5F5' },
    backBtnText: { fontSize: 14, fontWeight: '700', color: '#666' },
    nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    nextBtnText: { fontSize: 14, fontWeight: '800', color: 'white' },
});
