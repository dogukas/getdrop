import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, LogBox, Appearance, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['[Reanimated]']); // Reanimated mismatch logs vs.
import { PaperProvider } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useAppStore } from './src/store/useAppStore';
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
  const followSystem = useAppStore(s => s.followSystem);
  const setDarkMode = useAppStore(s => s.setDarkMode);
  const systemScheme = useColorScheme();

  // Sistem teması değişince store'u güncelle
  useEffect(() => {
    if (!followSystem) return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      const store = useAppStore.getState();
      if (store.followSystem) {
        store.setDarkMode(colorScheme === 'dark');
      }
    });
    return () => sub.remove();
  }, [followSystem]);

  // followSystem açıkken sistem değerine uyu
  const dark = followSystem ? systemScheme === 'dark' : isDarkMode;
  const paperTheme = dark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: '#2A7A50', secondary: '#6C63FF', background: '#0F1117', surface: '#1C2230' } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#2A7A50', secondary: '#6C63FF', background: '#F4F6F8', surface: '#FFFFFF' } };

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
            <PaperProvider theme={paperTheme}>
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
