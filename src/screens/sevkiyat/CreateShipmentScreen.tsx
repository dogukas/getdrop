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
import { createShipment } from '../../services/createService';

const GREEN = '#2A7A50';
const ORANGE = '#E8A020';
type Props = NativeStackScreenProps<any, 'CreateShipment'>;

const STEPS = ['Tedarikçi & Araç', 'Kalemler', 'Özet'];

function StepBar({ step, total, color }: { step: number; total: number; color: string }) {
    return (
        <View style={sb.wrap}>
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <View style={[sb.dot, i <= step && { backgroundColor: color, borderColor: color }]}>
                        {i < step
                            ? <Icon source="check" size={12} color="white" />
                            : <Text style={[sb.num, i === step && { color: 'white' }]}>{i + 1}</Text>
                        }
                    </View>
                    {i < total - 1 && <View style={[sb.line, i < step && { backgroundColor: color }]} />}
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

export default function CreateShipmentScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadShipments = useDataStore(s => s.loadShipments);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [supplier, setSupplier] = useState('');
    const [plate, setPlate] = useState('');
    const [driver, setDriver] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ productName: '', sku: '', expectedQty: '1' }]);
    const [loading, setLoading] = useState(false);

    const addItem = () => setItems(p => [...p, { productName: '', sku: '', expectedQty: '1' }]);
    const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: string, val: string) =>
        setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (step === 0) {
            if (!supplier.trim()) e.supplier = 'Tedarikçi adı zorunludur.';
            if (!expectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) e.date = 'Geçerli tarih giriniz (YYYY-AA-GG).';
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

    const totalQty = items.reduce((sum, it) => sum + (parseInt(it.expectedQty) || 0), 0);

    const handleSave = async () => {
        if (!activeBranch || !user) return;
        setLoading(true);
        try {
            const id = await createShipment({
                supplier, plate, driver, expectedDate, notes: notes || undefined,
                branchId: activeBranch.id, createdBy: user.id,
                items: items.map(i => ({ productName: i.productName, sku: i.sku, expectedQty: parseInt(i.expectedQty) || 1 })),
            });
            await addLog({
                level: 'info', title: 'Yeni Sevkiyat Oluşturuldu',
                description: `${supplier} tedarikçisinden sevkiyat oluşturuldu.`,
                module: 'Sevkiyat', entityId: id, user: user.name,
            });
            await loadShipments();
            showToast({ message: '✅ Sevkiyat oluşturuldu!', type: 'success' });
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Hata', e.message ?? 'Sevkiyat oluşturulamadı.');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.stepContainer}>
                <Text style={s.stepLabel}>{STEPS[step]}</Text>
                <StepBar step={step} total={STEPS.length} color={ORANGE} />
                <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any, backgroundColor: ORANGE }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Step 0: Tedarikçi & Araç */}
                {step === 0 && (
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={[s.cardIcon, { backgroundColor: `${ORANGE}15` }]}>
                                <Icon source="truck-outline" size={20} color={ORANGE} />
                            </View>
                            <Text style={s.cardTitle}>Tedarikçi & Araç Bilgisi</Text>
                        </View>
                        <FieldInput label="Tedarikçi *" value={supplier} onChangeText={v => { setSupplier(v); setErrors(e => ({ ...e, supplier: '' })); }} error={errors.supplier} icon="office-building-outline" accentColor={ORANGE} />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <FieldInput label="Araç Plakası" value={plate} onChangeText={setPlate} icon="car-outline" autoCapitalize="characters" accentColor={ORANGE} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <FieldInput label="Sürücü" value={driver} onChangeText={setDriver} icon="account-tie-outline" accentColor={ORANGE} />
                            </View>
                        </View>
                        <FieldInput label="Beklenen Tarih (YYYY-AA-GG) *" value={expectedDate} onChangeText={v => { setExpectedDate(v); setErrors(e => ({ ...e, date: '' })); }} error={errors.date} icon="calendar-outline" keyboardType="numbers-and-punctuation" accentColor={ORANGE} />
                        <FieldInput label="Notlar" value={notes} onChangeText={setNotes} icon="information-outline" multiline accentColor={ORANGE} />
                    </View>
                )}

                {/* Step 1: Kalemler */}
                {step === 1 && (
                    <View>
                        <View style={s.sectionRow}>
                            <Text style={s.sectionLabel}>BEKLENEN ÜRÜNLER</Text>
                            <TouchableOpacity style={[s.addBtn, { backgroundColor: `${ORANGE}12` }]} onPress={addItem}>
                                <Icon source="plus-circle-outline" size={16} color={ORANGE} />
                                <Text style={[s.addBtnText, { color: ORANGE }]}>Kalem Ekle</Text>
                            </TouchableOpacity>
                        </View>
                        {items.map((item, i) => (
                            <View key={i} style={s.itemCard}>
                                <View style={s.itemHeader}>
                                    <View style={[s.itemNum, { backgroundColor: `${ORANGE}12` }]}>
                                        <Text style={[s.itemNumText, { color: ORANGE }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.itemTitle}>Kalem {i + 1}</Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(i)} style={s.removeBtn}>
                                            <Icon source="trash-can-outline" size={16} color="#E05C5C" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <FieldInput label="Ürün Adı *" value={item.productName} onChangeText={v => { updateItem(i, 'productName', v); setErrors(e => ({ ...e, [`name_${i}`]: '' })); }} error={errors[`name_${i}`]} icon="package-variant" accentColor={ORANGE} />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 2 }}>
                                        <FieldInput label="SKU *" value={item.sku} onChangeText={v => { updateItem(i, 'sku', v); setErrors(e => ({ ...e, [`sku_${i}`]: '' })); }} error={errors[`sku_${i}`]} icon="barcode" autoCapitalize="none" accentColor={ORANGE} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <FieldInput label="Beklenen Adet" value={item.expectedQty} onChangeText={v => updateItem(i, 'expectedQty', v)} icon="counter" keyboardType="numeric" accentColor={ORANGE} />
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
                                <View style={[s.cardIcon, { backgroundColor: `${ORANGE}15` }]}>
                                    <Icon source="truck-check-outline" size={20} color={ORANGE} />
                                </View>
                                <Text style={s.cardTitle}>Sevkiyat Özeti</Text>
                            </View>
                            <SummaryRow icon="office-building-outline" label="Tedarikçi" value={supplier} color={ORANGE} />
                            {plate ? <SummaryRow icon="car-outline" label="Araç Plakası" value={plate} color={ORANGE} /> : null}
                            {driver ? <SummaryRow icon="account-tie-outline" label="Sürücü" value={driver} color={ORANGE} /> : null}
                            <SummaryRow icon="calendar-outline" label="Beklenen Tarih" value={expectedDate} color={ORANGE} />
                            {notes ? <SummaryRow icon="information-outline" label="Not" value={notes} color="#888" /> : null}
                        </View>
                        <View style={[s.card, { marginTop: 10 }]}>
                            <Text style={s.summarySection}>BEKLENEN ÜRÜNLER ({items.length} kalem · {totalQty} adet)</Text>
                            {items.map((it, i) => (
                                <View key={i} style={s.summaryItem}>
                                    <View>
                                        <Text style={s.summaryItemName}>{it.productName}</Text>
                                        <Text style={s.summaryItemSku}>{it.sku}</Text>
                                    </View>
                                    <View style={[s.qtyBadge, { backgroundColor: `${ORANGE}12` }]}>
                                        <Text style={[s.qtyText, { color: ORANGE }]}>{it.expectedQty} adet</Text>
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
                    <TouchableOpacity style={s.backBtn} onPress={back}>
                        <Icon source="arrow-left" size={18} color="#666" />
                        <Text style={s.backBtnText}>Geri</Text>
                    </TouchableOpacity>
                ) : <View style={{ flex: 1 }} />}
                {step < STEPS.length - 1 ? (
                    <TouchableOpacity style={[s.nextBtn, { backgroundColor: ORANGE, shadowColor: ORANGE }]} onPress={next}>
                        <Text style={s.nextBtnText}>İleri</Text>
                        <Icon source="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[s.nextBtn, { backgroundColor: ORANGE, shadowColor: ORANGE }, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                        <Icon source={loading ? "loading" : "check"} size={18} color="white" />
                        <Text style={s.nextBtnText}>{loading ? 'Kaydediliyor...' : 'Sevkiyatı Oluştur'}</Text>
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
                <View style={fi.iconWrap}><Icon source={icon} size={16} color={value ? accentColor : '#AAA'} /></View>
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
        <View style={sr2.row}>
            <View style={[sr2.icon, { backgroundColor: color + '12' }]}><Icon source={icon} size={14} color={color} /></View>
            <View style={{ flex: 1 }}>
                <Text style={sr2.label}>{label}</Text>
                <Text style={sr2.value}>{value}</Text>
            </View>
        </View>
    );
}
const sr2 = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    label: { fontSize: 10, color: '#AAA', fontWeight: '700' },
    value: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 1 },
});

const s = StyleSheet.create({
    stepContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingTop: 8 },
    stepLabel: { fontSize: 13, fontWeight: '700', color: '#666', textAlign: 'center', marginBottom: 4 },
    progressBg: { height: 3, backgroundColor: '#F0F0F0' },
    progressFill: { height: '100%' as any, borderRadius: 2 },
    scroll: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
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
