import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Divider, useTheme } from 'react-native-paper';

export default function SettingsScreen() {
    const theme = useTheme();

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
                Ayarlar
            </Text>

            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>
                GENEL
            </Text>
            <List.Item
                title="Dil"
                description="Türkçe"
                left={(props) => <List.Icon {...props} icon="translate" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <List.Item
                title="Bölge"
                description="Türkiye"
                left={(props) => <List.Icon {...props} icon="earth" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider style={{ marginVertical: 12 }} />

            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>
                HAKKINDA
            </Text>
            <List.Item
                title="Versiyon"
                description="1.0.0"
                left={(props) => <List.Icon {...props} icon="information-outline" />}
            />
            <List.Item
                title="Lisans"
                left={(props) => <List.Icon {...props} icon="file-document-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
});
