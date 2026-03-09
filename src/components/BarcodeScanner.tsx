import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Icon } from 'react-native-paper';

const { width, height } = Dimensions.get('window');
const GREEN = '#2A7A50';

interface BarcodeScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        // Kısa bir bekleme ve his için setTimeout
        setTimeout(() => {
            onScan(data);
        }, 500);
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Kamera izni isteniyor...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Kameraya erişim reddedildi</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeTxt}>Kapat</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
                }}
            />

            {/* Overlay Grid */}
            <View style={styles.overlay}>
                <View style={styles.topMask}>
                    <TouchableOpacity style={styles.closeIconWrapper} onPress={onClose}>
                        <Icon source="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Barkod Okutun</Text>
                    <Text style={styles.subtitle}>Odağı dikdörtgenin içine alın</Text>
                </View>

                <View style={styles.middleRow}>
                    <View style={styles.sideMask} />
                    <View style={styles.scanFrame}>
                        {/* Kenarlık Köşeleri */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {scanned && (
                            <View style={styles.scannedOverlay}>
                                <Icon source="check-circle" size={48} color={GREEN} />
                            </View>
                        )}
                    </View>
                    <View style={styles.sideMask} />
                </View>

                <View style={styles.bottomMask} />
            </View>
        </View>
    );
}

const frameSize = width * 0.7;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999, // En üstte olması için
    },
    text: { color: 'white', fontSize: 16 },
    closeBtn: { marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 },
    closeTxt: { color: 'white' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topMask: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 40,
        position: 'relative'
    },
    closeIconWrapper: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30, // SafeArea
        right: 20,
        width: 44, height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 22, fontWeight: '800', color: 'white', letterSpacing: 1 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
    middleRow: {
        flexDirection: 'row',
        height: frameSize,
    },
    sideMask: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanFrame: {
        width: frameSize,
        height: frameSize,
        backgroundColor: 'transparent',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomMask: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },

    // Köşe çerçeveleri (Corners)
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: GREEN,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },

    scannedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(42, 122, 80, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12
    }
});
