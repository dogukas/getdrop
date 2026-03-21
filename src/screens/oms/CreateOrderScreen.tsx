import React, { useState, useRef, useMemo } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, Animated, FlatList, TextInput as RNTextInput,
} from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useToast } from '../../context/ToastContext';
import { createOrder } from '../../services/createService';
import BarcodeScanner from '../../components/BarcodeScanner';

const GREEN = '#2A7A50';
const PURPLE = '#6C63FF';
type Props = NativeStackScreenProps<any, 'CreateOrder'>;

interface ItemForm { productName: string; sku: string; quantity: string; unitPrice: string; }

// ── Step İndikatörü ──────────────────────────────────────
function StepBar({ step, total }: { step: number; total: number }) {
    return (
        <View style={sb.wrap}>
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <View style={[sb.dot, i < step && { backgroundColor: GREEN }, i === step && { backgroundColor: GREEN, borderColor: GREEN }]}>
                        {i < step
                            ? <Icon source="check" size={12} color="white" />
                            : <Text style={[sb.num, i === step && { color: GREEN }]}>{i + 1}</Text>
                        }
                    </View>
                    {i < total - 1 && <View style={[sb.line, i < step - 1 && { backgroundColor: GREEN }]} />}
                </React.Fragment>
            ))}
        </View>
    );
}
const sb = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
    dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#DDD', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    line: { flex: 1, height: 2, backgroundColor: '#DDD', marginHorizontal: 4 },
    num: { fontSize: 12, fontWeight: '800', color: '#CCC' },
});

const STEPS = ['Müşteri Bilgisi', 'Kalemler', 'Özet'];

export default function CreateOrderScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const orders = useDataStore(s => s.orders);
    const loadOrders = useDataStore(s => s.loadOrders);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [customer, setCustomer] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemForm[]>([
        { productName: '', sku: '', quantity: '1', unitPrice: '0' },
    ]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Önceki müşterileri siparişlerden topla (tekrar yok, en son adresini al)
    const customerHistory = useMemo(() => {
        const map = new Map<string, string>();
        [...orders].reverse().forEach(o => {
            if (!map.has(o.customer)) map.set(o.customer, o.address ?? '');
        });
        return Array.from(map.entries()).map(([name, addr]) => ({ name, address: addr }));
    }, [orders]);

    const suggestions = useMemo(() => {
        if (!customer.trim() || customer.length < 1) return [];
        return customerHistory.filter(c =>
            c.name.toLowerCase().includes(customer.toLowerCase())
        ).slice(0, 5);
    }, [customer, customerHistory]);

    const selectSuggestion = (name: string, addr: string) => {
        setCustomer(name);
        if (addr) setAddress(addr);
        setShowSuggestions(false);
        setErrors(e => ({ ...e, customer: '', address: '' }));
    };

    // Barkod okuyucu state: null ise kapalı, number ise o index'teki item'ın barkodu okunuyor
    const [scanningItemIndex, setScanningItemIndex] = useState<number | null>(null);

    const addItem = () => setItems(p => [...p, { productName: '', sku: '', quantity: '1', unitPrice: '0' }]);
    const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ItemForm, val: string) =>
        setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (step === 0) {
            if (!customer.trim()) e.customer = 'Müşteri adı zorunludur.';
            if (!address.trim()) e.address = 'Adres zorunludur.';
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

    const totalAmount = items.reduce((sum, it) => sum + (parseInt(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);

    const handleSave = async () => {
        if (!activeBranch || !user) return;
        setLoading(true);
        try {
            const orderId = await createOrder({
                customer, address, notes: notes || undefined,
                branchId: activeBranch.id,
                createdBy: user.id,
                items: items.map(i => ({
                    productName: i.productName, sku: i.sku,
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
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Step İndikatörü */}
            <View style={s.stepContainer}>
                <Text style={s.stepLabel}>{STEPS[step]}</Text>
                <StepBar step={step} total={STEPS.length} />
                <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
                </View>
            </View>

            {/* Barkod Okuyucu Modal (Overlay) */}
            {scanningItemIndex !== null && (
                <BarcodeScanner
                    onClose={() => setScanningItemIndex(null)}
                    onScan={(data) => {
                        updateItem(scanningItemIndex, 'sku', data);
                        setErrors(e => ({ ...e, [`sku_${scanningItemIndex}`]: '' }));
                        setScanningItemIndex(null);
                        showToast({ message: `Barkod okundu: ${data}`, type: 'success' });
                    }}
                />
            )}

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {step === 0 && (
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={[s.cardIcon, { backgroundColor: `${GREEN}15` }]}>
                                <Icon source="account-outline" size={20} color={GREEN} />
                            </View>
                            <Text style={s.cardTitle}>Müşteri Bilgisi</Text>
                        </View>

                        {/* Müşteri adı — Autocomplete */}
                        <View style={fi2.wrap}>
                            <View style={[fi2.inputBox, errors.customer && { borderColor: '#E05C5C', borderWidth: 1.5 }]}>
                                <View style={fi2.iconWrap}>
                                    <Icon source="account-outline" size={16} color={customer ? GREEN : '#AAA'} />
                                </View>
                                <TextInput
                                    mode="flat"
                                    label="Müşteri Adı *"
                                    value={customer}
                                    onChangeText={(v: string) => {
                                        setCustomer(v);
                                        setShowSuggestions(true);
                                        setErrors(e => ({ ...e, customer: '' }));
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    style={fi2.input}
                                    theme={{ colors: { background: 'transparent' } }}
                                />
                                {customer.length > 0 && (
                                    <TouchableOpacity onPress={() => { setCustomer(''); setAddress(''); }} style={{ padding: 10 }}>
                                        <Icon source="close-circle" size={16} color="#CCC" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors.customer ? <Text style={fi2.error}>{errors.customer}</Text> : null}

                            {/* Autocomplete dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <View style={ac.dropdown}>
                                    {suggestions.map((sg, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[ac.item, idx < suggestions.length - 1 && ac.itemBorder]}
                                            onPress={() => selectSuggestion(sg.name, sg.address)}
                                            activeOpacity={0.7}
                                        >
                                            <Icon source="account-clock-outline" size={14} color={GREEN} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={ac.itemName}>{sg.name}</Text>
                                                {sg.address ? <Text style={ac.itemAddr} numberOfLines={1}>{sg.address}</Text> : null}
                                            </View>
                                            <Icon source="arrow-top-left" size={12} color="#CCC" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <FieldInput
                            label="Teslimat Adresi *"
                            value={address}
                            onChangeText={(v: string) => { setAddress(v); setErrors(e => ({ ...e, address: '' })); }}
                            error={errors.address}
                            icon="map-marker-outline"
                            multiline
                        />
                        <FieldInput
                            label="Notlar (İsteğe Bağlı)"
                            value={notes}
                            onChangeText={setNotes}
                            icon="information-outline"
                            multiline
                        />
                    </View>
                )}

                {/* Step 1: Kalemler */}
                {step === 1 && (
                    <View>
                        <View style={s.sectionRow}>
                            <Text style={s.sectionLabel}>ÜRÜN KALEMLERİ</Text>
                            <TouchableOpacity style={s.addBtn} onPress={addItem}>
                                <Icon source="plus-circle-outline" size={16} color={GREEN} />
                                <Text style={s.addBtnText}>Kalem Ekle</Text>
                            </TouchableOpacity>
                        </View>
                        {items.map((item, i) => (
                            <View key={i} style={s.itemCard}>
                                <View style={s.itemHeader}>
                                    <View style={[s.itemNum, { backgroundColor: `${GREEN}15` }]}>
                                        <Text style={s.itemNumText}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.itemTitle}>Kalem {i + 1}</Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(i)} style={s.removeBtn}>
                                            <Icon source="trash-can-outline" size={16} color="#E05C5C" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <FieldInput
                                    label="Ürün Adı *"
                                    value={item.productName}
                                    onChangeText={(v: string) => { updateItem(i, 'productName', v); setErrors(e => ({ ...e, [`name_${i}`]: '' })); }}
                                    error={errors[`name_${i}`]}
                                    icon="package-variant"
                                />
                                <FieldInput
                                    label="SKU *"
                                    value={item.sku}
                                    onChangeText={(v: string) => { updateItem(i, 'sku', v); setErrors(e => ({ ...e, [`sku_${i}`]: '' })); }}
                                    error={errors[`sku_${i}`]}
                                    icon="barcode"
                                    autoCapitalize="none"
                                    rightIcon="barcode-scan"
                                    onRightIconPress={() => setScanningItemIndex(i)}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <FieldInput label="Adet" value={item.quantity} onChangeText={(v: string) => updateItem(i, 'quantity', v)} icon="counter" keyboardType="numeric" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <FieldInput label="Birim Fiyat (₺)" value={item.unitPrice} onChangeText={(v: string) => updateItem(i, 'unitPrice', v)} icon="currency-try" keyboardType="numeric" />
                                    </View>
                                </View>
                                <View style={s.itemTotal}>
                                    <Text style={s.itemTotalLabel}>Kalem Toplamı:</Text>
                                    <Text style={s.itemTotalValue}>₺{((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Step 2: Özet */}
                {step === 2 && (
                    <View>
                        <View style={s.summaryCard}>
                            <View style={s.cardHeader}>
                                <View style={[s.cardIcon, { backgroundColor: `${GREEN}15` }]}>
                                    <Icon source="check-circle-outline" size={20} color={GREEN} />
                                </View>
                                <Text style={s.cardTitle}>Sipariş Özeti</Text>
                            </View>
                            <SummaryRow icon="account-outline" label="Müşteri" value={customer} color={GREEN} />
                            <SummaryRow icon="map-marker-outline" label="Adres" value={address} color={PURPLE} />
                            {notes ? <SummaryRow icon="information-outline" label="Not" value={notes} color="#E8A020" /> : null}
                        </View>
                        <View style={[s.summaryCard, { marginTop: 10 }]}>
                            <Text style={s.summarySection}>KALEMLER ({items.length} adet)</Text>
                            {items.map((it, i) => (
                                <View key={i} style={s.summaryItem}>
                                    <View style={s.summaryItemLeft}>
                                        <Text style={s.summaryItemName} numberOfLines={1}>{it.productName}</Text>
                                        <Text style={s.summaryItemSku}>{it.sku} · {it.quantity} adet</Text>
                                    </View>
                                    <Text style={s.summaryItemPrice}>₺{((parseInt(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
                                </View>
                            ))}
                            <View style={s.totalRow}>
                                <Text style={s.totalLabel}>TOPLAM TUTAR</Text>
                                <Text style={s.totalValue}>₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Alt Navigasyon */}
            <View style={s.navBar}>
                {step > 0 ? (
                    <TouchableOpacity style={s.backBtn} onPress={back} activeOpacity={0.8}>
                        <Icon source="arrow-left" size={18} color="#666" />
                        <Text style={s.backBtnText}>Geri</Text>
                    </TouchableOpacity>
                ) : <View style={{ flex: 1 }} />}

                {step < STEPS.length - 1 ? (
                    <TouchableOpacity style={s.nextBtn} onPress={next} activeOpacity={0.85}>
                        <Text style={s.nextBtnText}>İleri</Text>
                        <Icon source="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[s.nextBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Icon source={loading ? "loading" : "check"} size={18} color="white" />
                        <Text style={s.nextBtnText}>{loading ? 'Kaydediliyor...' : 'Siparişi Oluştur'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

// ── Yardımcı Bileşenler ─────────────────────────────────
function FieldInput({ label, value, onChangeText, error, icon, multiline, autoCapitalize, keyboardType, rightIcon, onRightIconPress }: any) {
    return (
        <View style={fi.wrap}>
            <View style={[fi.inputBox, error && { borderColor: '#E05C5C', borderWidth: 1.5 }]}>
                <View style={fi.iconWrap}>
                    <Icon source={icon} size={16} color={value ? GREEN : '#AAA'} />
                </View>
                <TextInput
                    mode="flat"
                    label={label}
                    value={value}
                    onChangeText={onChangeText}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    style={fi.input}
                    multiline={multiline}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    theme={{ colors: { background: 'transparent' } }}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={{ padding: 10 }}>
                        <Icon source={rightIcon} size={20} color={GREEN} />
                    </TouchableOpacity>
                )}
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

const fi2 = StyleSheet.create({
    wrap: { marginBottom: 10, position: 'relative', zIndex: 10 },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: 14, borderWidth: 1, borderColor: '#EAEAEA', paddingLeft: 10 },
    iconWrap: { marginTop: 6 },
    input: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },
    error: { fontSize: 11, color: '#E05C5C', marginTop: 3, marginLeft: 4 },
});

const ac = StyleSheet.create({
    dropdown: {
        backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEAEA',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 6,
        marginTop: 4, overflow: 'hidden',
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    itemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    itemAddr: { fontSize: 11, color: '#AAA', marginTop: 1 },
});


function SummaryRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <View style={sr.row}>
            <View style={[sr.icon, { backgroundColor: color + '12' }]}>
                <Icon source={icon} size={14} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={sr.label}>{label}</Text>
                <Text style={sr.value}>{value}</Text>
            </View>
        </View>
    );
}
const sr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    label: { fontSize: 10, color: '#AAA', fontWeight: '700' },
    value: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 1 },
});

const GREEN_LOCAL = GREEN;
const s = StyleSheet.create({
    stepContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingTop: 8 },
    stepLabel: { fontSize: 13, fontWeight: '700', color: '#666', textAlign: 'center', marginBottom: 4 },
    progressBg: { height: 3, backgroundColor: '#F0F0F0', marginTop: 4 },
    progressFill: { height: '100%', backgroundColor: GREEN, borderRadius: 2, transition: 'width 0.3s' } as any,
    scroll: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${GREEN}12`, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
    addBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },
    itemCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    itemNum: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    itemNumText: { fontSize: 12, fontWeight: '800', color: GREEN },
    itemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    removeBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#E05C5C10', alignItems: 'center', justifyContent: 'center' },
    itemTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${GREEN}08`, borderRadius: 10, padding: 10, marginTop: 4 },
    itemTotalLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
    itemTotalValue: { fontSize: 14, fontWeight: '800', color: GREEN },
    summaryCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    summarySection: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginBottom: 14 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    summaryItemLeft: { flex: 1, marginRight: 10 },
    summaryItemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
    summaryItemSku: { fontSize: 11, color: '#AAA', marginTop: 2 },
    summaryItemPrice: { fontSize: 13, fontWeight: '800', color: GREEN },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 2, borderTopColor: '#F0F0F0' },
    totalLabel: { fontSize: 12, fontWeight: '800', color: '#888' },
    totalValue: { fontSize: 20, fontWeight: '800', color: GREEN },
    navBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    backBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F5F5' },
    backBtnText: { fontSize: 14, fontWeight: '700', color: '#666' },
    nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: GREEN, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    nextBtnText: { fontSize: 14, fontWeight: '800', color: 'white' },
});
