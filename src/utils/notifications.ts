import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Uygulama açıkken bildirim göster
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Expo Push Token alır ve döndürür.
 * - Fiziksel cihaz gerektirir (emülatörde token alınamaz)
 * - Android: bildirim kanalı oluşturur
 * - İzin yoksa kullanıcıdan ister
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    // Android'de bildirim kanalı oluştur
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Genel Bildirimler',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6C63FF',
            sound: 'default',
        });
    }

    // Fiziksel cihaz değilse token alamayız
    if (!Device.isDevice) {
        console.log('[Notifications] Push token sadece fiziksel cihazda çalışır.');
        return undefined;
    }

    try {
        // Mevcut izin durumunu kontrol et
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // İzin yoksa kullanıcıdan iste
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Push bildirim izni reddedildi.');
            return undefined;
        }

        // Expo Push Token al
        const { data: token } = await Notifications.getExpoPushTokenAsync({
            projectId: '1a051233-b025-4200-9111-8b40ffdcf9cd',
        });

        console.log('[Notifications] Push Token:', token);
        return token;
    } catch (e) {
        console.error('[Notifications] Token alınırken hata:', e);
        return undefined;
    }
}

/**
 * Bildirime tıklandığında çalıştırılacak listener'ı kaydeder.
 * navigation ref ile sayfaya yönlendirme yapılabilir.
 */
export function setupNotificationListeners(
    onReceive?: (n: Notifications.Notification) => void,
    onResponse?: (r: Notifications.NotificationResponse) => void,
) {
    const receiveSub = Notifications.addNotificationReceivedListener(n => {
        console.log('[Notifications] Bildirim alındı:', n);
        onReceive?.(n);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(r => {
        console.log('[Notifications] Bildirime tıklandı:', r);
        onResponse?.(r);
    });

    return () => {
        receiveSub.remove();
        responseSub.remove();
    };
}
