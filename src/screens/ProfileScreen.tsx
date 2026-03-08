import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, List, Switch, Divider, useTheme } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';

export default function ProfileScreen() {
    const theme = useTheme();
    const { user, isDarkMode, toggleTheme, setUser } = useAppStore();

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.avatarSection}>
                <Avatar.Text
                    size={80}
                    label={user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                    style={{ backgroundColor: theme.colors.primary }}
                />
                <Text variant="headlineSmall" style={{ marginTop: 12, fontWeight: 'bold' }}>
                    {user?.name ?? 'Kullanıcı'}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {user?.email ?? 'email@ornek.com'}
                </Text>
            </View>

            <Divider style={{ marginVertical: 16 }} />

            <List.Item
                title="Karanlık Mod"
                description="Temayı değiştir"
                left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
                right={() => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
            />
            <List.Item
                title="Bildirimler"
                left={(props) => <List.Icon {...props} icon="bell-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <List.Item
                title="Gizlilik"
                left={(props) => <List.Icon {...props} icon="shield-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider style={{ marginVertical: 16 }} />
            <List.Item
                title="Çıkış Yap"
                titleStyle={{ color: theme.colors.error }}
                left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                onPress={() => setUser(null)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    avatarSection: { alignItems: 'center', paddingVertical: 24 },
});
