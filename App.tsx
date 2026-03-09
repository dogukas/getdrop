import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { useAppStore } from './src/store/useAppStore';
import { lightTheme, darkTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';

export default function App() {
  const isDarkMode = useAppStore(s => s.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <AuthProvider>
      <ToastProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
        </PaperProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
