import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';

interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    color?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, color = '#CCC' }: EmptyStateProps) {
    return (
        <View style={e.root}>
            <View style={[e.iconBox, { backgroundColor: `${color}15` }]}>
                <Icon source={icon} size={40} color={color} />
            </View>
            <Text style={e.title}>{title}</Text>
            {description && <Text style={e.desc}>{description}</Text>}
            {actionLabel && onAction && (
                <TouchableOpacity style={[e.btn, { backgroundColor: `${color}18`, borderColor: `${color}40` }]} onPress={onAction} activeOpacity={0.7}>
                    <Text style={[e.btnText, { color }]}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const e = StyleSheet.create({
    root: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
    iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'center' },
    desc: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
    btn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    btnText: { fontSize: 13, fontWeight: '700' },
});
