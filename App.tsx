import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useAppStore } from './src/store/useAppStore';
import { lightTheme, darkTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';

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
          source={require('../assets/splash-brand.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#2A7A50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
  }
});
