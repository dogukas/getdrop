import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Go'da Push notification desteği kaldırıldığı için (SDK 53) try-catch içinde deniyoruz.
try {
    // Bildirim davranışını ayarla (uygulama açıkken bile bildirim gelsin)
    /* Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        } as Notifications.NotificationBehavior), // Type cannot be used as a value
    }); */
} catch (e) {
    console.warn("[Notifications] setNotificationHandler failed. Using Expo Go? ", e);
}

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        /* await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX, // Also this
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6C63FF',
        }); */
    }

    if (Device.isDevice) {
        /* const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Bildirim izni alınamadı!');
            return undefined;
        }

        try {
            const projectId = 'getdrop'; // Expo projenizin slug veya ID'si
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log("Push Token:", token);
        } catch (e) {
            console.error("Token alınırken hata:", e);
        } */
    } else {
        console.log('Push bildirimleri için fiziksel bir cihaz gereklidir.');
    }

    return token;
}
