import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
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

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 1500)); // Minimum 1.5 sn logoyu göster
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
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
