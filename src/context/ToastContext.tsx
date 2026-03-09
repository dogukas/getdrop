import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextData {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastOptions | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback(({ message, type = 'info', duration = 4000 }: ToastOptions) => {
        // Önceki toast'u temizle
        if (hideTimeout.current) clearTimeout(hideTimeout.current);

        setToast({ message, type });

        // Toast'u ekrana getir (Slide up + Fade in)
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();

        // Süre dolunca gizle
        hideTimeout.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, []);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start(() => setToast(null));
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return { bg: '#E8F5E9', border: '#4CAF50', icon: 'check-circle', color: '#2E7D32' };
            case 'error': return { bg: '#FDECEA', border: '#E05C5C', icon: 'alert-circle', color: '#C62828' };
            case 'info': return { bg: '#E8EAF6', border: '#6C63FF', icon: 'information', color: '#283593' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Görünümü (Tüm ekranların üstünde yüzer) */}
            {toast && (
                <Animated.View
                    style={[
                        s.toastContainer,
                        { opacity, transform: [{ translateY }] },
                        { backgroundColor: getColors(toast.type!).bg, borderLeftColor: getColors(toast.type!).border }
                    ]}
                >
                    <Icon source={getColors(toast.type!).icon} size={20} color={getColors(toast.type!).color} />
                    <Text style={[s.toastText, { color: getColors(toast.type!).color }]}>
                        {toast.message}
                    </Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

const s = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
        zIndex: 9999,
        gap: 10,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    }
});
