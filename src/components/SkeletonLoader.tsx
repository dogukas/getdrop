import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                { width: width as any, height, borderRadius, backgroundColor: '#E8EDF0' },
                { opacity },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    return (
        <View style={sk.card}>
            <View style={sk.row}>
                <SkeletonBox width={44} height={44} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                    <SkeletonBox width="60%" height={14} />
                    <SkeletonBox width="40%" height={11} />
                </View>
                <SkeletonBox width={60} height={24} borderRadius={12} />
            </View>
            <View style={sk.divider} />
            <View style={sk.footer}>
                <SkeletonBox width={70} height={11} />
                <SkeletonBox width={70} height={11} />
                <SkeletonBox width={70} height={11} />
            </View>
        </View>
    );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
    return (
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}

const sk = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    footer: { flexDirection: 'row', gap: 12 },
});
