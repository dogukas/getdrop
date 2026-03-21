/**
 * useTheme — Tema renk tokenlarını döndüren hook.
 *
 * Öncelik sırası:
 *  1. Eğer followSystem = true ise → cihazın system color scheme'ini kullan
 *  2. Değilse → store'daki isDarkMode manüel değerini kullan
 *
 * Performans: Sadece isDarkMode veya systemColorScheme değiştiğinde yeniden render.
 */

import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';
import { useAppStore } from '../store/useAppStore';

export function useTheme(): ThemeColors {
    const isDarkMode = useAppStore(s => s.isDarkMode);
    const followSystem = useAppStore(s => s.followSystem);
    const systemScheme = useColorScheme(); // 'dark' | 'light' | null

    const dark = followSystem ? systemScheme === 'dark' : isDarkMode;
    return dark ? darkColors : lightColors;
}

/** Sadece boolean döner — daha verimli (gereksiz yeniden render engellemek için) */
export function useIsDark(): boolean {
    const isDarkMode = useAppStore(s => s.isDarkMode);
    const followSystem = useAppStore(s => s.followSystem);
    const systemScheme = useColorScheme();
    return followSystem ? systemScheme === 'dark' : isDarkMode;
}
