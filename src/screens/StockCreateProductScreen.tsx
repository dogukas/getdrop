import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { useActivityStore } from '../store/useActivityStore';
import { useToast } from '../context/ToastContext';
import { createProduct } from '../services/createService';

const GREEN = '#2A7A50';
const BLUE = '#2196F3';
type Props = NativeStackScreenProps<any, 'CreateProduct'>;

const UNITS = ['adet', 'kg', 'lt', 'm', 'm²', 'kutu', 'paket', 'koli'];

const CATEGORY_OPTIONS = [
    { key: 'electronics', label: 'Elektronik', icon: 'chip' },
    { key: 'clothing', label: 'Giyim', icon: 'hanger' },
    { key: 'food', label: 'Gıda', icon: 'food-apple-outline' },
    { key: 'cosmetics', label: 'Kozmetik', icon: 'bottle-tonic-outline' },
    { key: 'hardware', label: 'Hırdavat', icon: 'tools' },
    { key: 'other', label: 'Diğer', icon: 'package-variant' },
];

const STEPS = ['Ürün Bilgisi', 'Stok & Birim', 'Özet'];

function StepBar({ step, total }: { step: number; total: number }) {
    return (
        <View style={sb.wrap}>
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <View style={[sb.dot, i <= step && { backgroundColor: BLUE, borderColor: BLUE }]}>
                        {i < step
                            ? <Icon source="check" size={12} color="white" />
                            : <Text style={[sb.num, i === step && { color: 'white' }]}>{i + 1}</Text>
                        }
                    </View>
                    {i < total - 1 && <View style={[sb.line, i < step && { backgroundColor: BLUE }]} />}
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

export default function CreateProductScreen({ navigation }: Props) {
    const user = useAppStore(s => s.user);
    const activeBranch = useAppStore(s => s.activeBranch);
    const loadProducts = useDataStore(s => s.loadProducts);
    const addLog = useActivityStore(s => s.addLog);
    const { showToast } = useToast();

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('other');
    const [stock, setStock] = useState('0');
    const [unit, setUnit] = useState('adet');
    const [minStock, setMinStock] = useState('10');
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (step === 0) {
            if (!name.trim()) e.name = 'Ürün adı zorunludur.';
            if (!sku.trim()) e.sku = 'SKU zorunludur.';
        }
        if (step === 1) {
            if (parseInt(stock) < 0) e.stock = 'Stok sayısı 0 veya üzeri olmalıdır.';
            if (parseInt(minStock) <= 0) e.minStock = 'Minimum stok 1 veya üzeri olmalıdır.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate()) setStep(s => s + 1); };
    const back = () => setStep(s => s - 1);

    const stockNum = parseInt(stock) || 0;
    const minStockNum = parseInt(minStock) || 10;
    const stockStatus = stockNum === 0 ? 'critical' : stockNum < minStockNum ? 'low' : 'ok';
    const statusColors = { critical: '#E05C5C', low: '#E8A020', ok: GREEN };
    const statusLabels = { critical: 'Kritik', low: 'Düşük', ok: 'Normal' };

    const handleSave = async () => {
        if (!activeBranch || !user) return;
        setLoading(true);
        try {
            await createProduct({
                name, sku, stock: stockNum,
                unit, minStock: minStockNum,
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
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.stepContainer}>
                <Text style={s.stepLabel}>{STEPS[step]}</Text>
                <StepBar step={step} total={STEPS.length} />
                <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Step 0: Ürün Bilgisi */}
                {step === 0 && (
                    <View>
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={[s.cardIcon, { backgroundColor: `${BLUE}15` }]}>
                                    <Icon source="package-variant-closed" size={20} color={BLUE} />
                                </View>
                                <Text style={s.cardTitle}>Ürün Bilgisi</Text>
                            </View>
                            <FieldInput label="Ürün Adı *" value={name} onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: '' })); }} error={errors.name} icon="tag-outline" />
                            <FieldInput label="SKU (Stok Kodu) *" value={sku} onChangeText={v => { setSku(v); setErrors(e => ({ ...e, sku: '' })); }} error={errors.sku} icon="barcode" autoCapitalize="none" />
                        </View>

                        {/* Kategori Seçimi */}
                        <Text style={s.sectionLabel}>KATEGORİ</Text>
                        <View style={s.categoryGrid}>
                            {CATEGORY_OPTIONS.map(cat => {
                                const active = category === cat.key;
                                return (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[s.categoryCard, active && { borderColor: BLUE, backgroundColor: `${BLUE}08` }]}
                                        onPress={() => setCategory(cat.key)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[s.catIcon, { backgroundColor: active ? `${BLUE}15` : '#F0F0F0' }]}>
                                            <Icon source={cat.icon} size={18} color={active ? BLUE : '#888'} />
                                        </View>
                                        <Text style={[s.catLabel, active && { color: BLUE, fontWeight: '700' }]}>{cat.label}</Text>
                                        {active && <View style={s.catCheck}><Icon source="check-circle" size={14} color={BLUE} /></View>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Step 1: Stok & Birim */}
                {step === 1 && (
                    <View>
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={[s.cardIcon, { backgroundColor: `${GREEN}15` }]}>
                                    <Icon source="archive-outline" size={20} color={GREEN} />
                                </View>
                                <Text style={s.cardTitle}>Stok Bilgisi</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <FieldInput label="Başlangıç Stok" value={stock} onChangeText={v => { setStock(v); setErrors(e => ({ ...e, stock: '' })); }} error={errors.stock} icon="counter" keyboardType="numeric" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <FieldInput label="Min Stok Uyarısı" value={minStock} onChangeText={v => { setMinStock(v); setErrors(e => ({ ...e, minStock: '' })); }} error={errors.minStock} icon="alert-outline" keyboardType="numeric" />
                                </View>
                            </View>

                            {/* Stok Durumu Önizleme */}
                            <View style={[s.stockPreview, { backgroundColor: statusColors[stockStatus] + '10', borderColor: statusColors[stockStatus] + '30' }]}>
                                <Icon source={stockStatus === 'ok' ? 'check-circle-outline' : stockStatus === 'low' ? 'alert-outline' : 'alert-circle-outline'} size={18} color={statusColors[stockStatus]} />
                                <View>
                                    <Text style={[s.stockPreviewTitle, { color: statusColors[stockStatus] }]}>Stok Durumu: {statusLabels[stockStatus]}</Text>
                                    <Text style={s.stockPreviewSub}>{stockNum} adet mevcut · {minStockNum} adet minimum</Text>
                                </View>
                            </View>
                        </View>

                        {/* Birim Seçimi */}
                        <Text style={[s.sectionLabel, { marginTop: 16 }]}>BİRİM SEÇİMİ</Text>
                        <View style={s.unitGrid}>
                            {UNITS.map(u => {
                                const active = unit === u;
                                return (
                                    <TouchableOpacity
                                        key={u}
                                        style={[s.unitChip, active && { backgroundColor: `${GREEN}12`, borderColor: GREEN }]}
                                        onPress={() => setUnit(u)}
                                    >
                                        <Text style={[s.unitText, active && { color: GREEN, fontWeight: '700' }]}>{u}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Step 2: Özet */}
                {step === 2 && (
                    <View>
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={[s.cardIcon, { backgroundColor: `${GREEN}15` }]}>
                                    <Icon source="check-circle-outline" size={20} color={GREEN} />
                                </View>
                                <Text style={s.cardTitle}>Ürün Özeti</Text>
                            </View>

                            {/* Ürün Önizleme */}
                            <View style={s.productPreview}>
                                <View style={[s.previewIcon, { backgroundColor: `${BLUE}12` }]}>
                                    <Icon source={CATEGORY_OPTIONS.find(c => c.key === category)?.icon ?? 'package-variant'} size={28} color={BLUE} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.previewName}>{name}</Text>
                                    <Text style={s.previewSku}>{sku}</Text>
                                </View>
                                <View style={[s.statusPill, { backgroundColor: statusColors[stockStatus] + '15' }]}>
                                    <Text style={[s.statusPillText, { color: statusColors[stockStatus] }]}>{statusLabels[stockStatus]}</Text>
                                </View>
                            </View>

                            <SummaryRow icon="tag-outline" label="Kategori" value={CATEGORY_OPTIONS.find(c => c.key === category)?.label ?? category} color={BLUE} />
                            <SummaryRow icon="counter" label="Başlangıç Stok" value={`${stock} ${unit}`} color={GREEN} />
                            <SummaryRow icon="alert-outline" label="Minimum Stok" value={`${minStock} ${unit}`} color="#E8A020" />
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
                    <TouchableOpacity style={s.nextBtn} onPress={next}>
                        <Text style={s.nextBtnText}>İleri</Text>
                        <Icon source="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[s.nextBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                        <Icon source={loading ? "loading" : "check"} size={18} color="white" />
                        <Text style={s.nextBtnText}>{loading ? 'Kaydediliyor...' : 'Ürünü Ekle'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

function FieldInput({ label, value, onChangeText, error, icon, multiline, autoCapitalize, keyboardType }: any) {
    return (
        <View style={fi.wrap}>
            <View style={[fi.inputBox, error && { borderColor: '#E05C5C', borderWidth: 1.5 }]}>
                <View style={fi.iconWrap}><Icon source={icon} size={16} color={value ? BLUE : '#AAA'} /></View>
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
            <View style={[srow.icon, { backgroundColor: color + '12' }]}><Icon source={icon} size={14} color={color} /></View>
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
    progressFill: { height: '100%' as any, backgroundColor: BLUE, borderRadius: 2 },
    scroll: { padding: 16 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#EAEAEA', alignItems: 'center', gap: 8, position: 'relative' },
    catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    catLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
    catCheck: { position: 'absolute', top: 8, right: 8 },
    stockPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, borderWidth: 1, marginTop: 4 },
    stockPreviewTitle: { fontSize: 13, fontWeight: '700' },
    stockPreviewSub: { fontSize: 11, color: '#888', marginTop: 2 },
    unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    unitChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#EAEAEA' },
    unitText: { fontSize: 13, fontWeight: '600', color: '#666' },
    productPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFF', borderRadius: 16, padding: 14, marginBottom: 16 },
    previewIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    previewName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    previewSku: { fontSize: 12, color: '#888', marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusPillText: { fontSize: 11, fontWeight: '800' },
    navBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    backBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F5F5' },
    backBtnText: { fontSize: 14, fontWeight: '700', color: '#666' },
    nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: BLUE, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    nextBtnText: { fontSize: 14, fontWeight: '800', color: 'white' },
});
