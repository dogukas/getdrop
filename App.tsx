import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['[Reanimated]']); // Reanimated mismatch logs vs.
import { PaperProvider } from 'react-native-paper';
import { useAppStore } from './src/store/useAppStore';
import { lightTheme, darkTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
// import * as Notifications from 'expo-notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const isDarkMode = useAppStore(s => s.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [appIsReady, setAppIsReady] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Logoyu 2 saniye göster
      } catch (e) {
        console.warn(e);
      } finally {
        // Animasyonlu çıkış
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setAppIsReady(true);
        });
      }
    }

    prepare();

    // Foreground notification listener
    let subscription: any = null; // Notifications.Subscription | null = null;
    try {
      /*subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Foreground notification received:', notification);
      });*/
    } catch (e) {
      console.warn("Foreground notification listener err: ", e);
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('./assets/splash-brand.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <PaperProvider theme={theme}>
              <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <AppNavigator />
              </View>
            </PaperProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
  }
});
