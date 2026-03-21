/**
 * GetDrop — Merkezi Tema Renk Tokenları
 * Light + Dark tarafı tam simetrik. Tüm ekranlar bu dosyadan renk alır.
 */

export const palette = {
    green: '#2A7A50',
    greenLight: '#3CA069',
    greenDark: '#1E5938',
    purple: '#6C63FF',
    orange: '#E8A020',
    red: '#E05C5C',
    red2: '#C0392B',
    blue: '#2196F3',
};

export interface ThemeColors {
    // Zemin
    bg: string;
    bg2: string;        // Hafif ayrımlı ikinci yüzey
    card: string;
    cardBorder: string;
    // Metinler
    text: string;
    textSub: string;
    textMuted: string;
    textOnGreen: string;
    // Bileşenler
    input: string;
    inputBorder: string;
    divider: string;
    // İkonlar ve arka planlar
    iconBg: string;
    // Sabitler (dark/light farketmez)
    green: string;
    greenLight: string;
    purple: string;
    orange: string;
    red: string;
    blue: string;
    // Özel
    headerBg: string;
    headerText: string;
    sidebarBg: string;
    statusBar: 'light-content' | 'dark-content';
    // Switch tint
    switchTrack: string;
    switchThumb: string;
    // Shadow opacity
    shadowOpacity: number;
    // Skeleton
    skeleton: string;
    skeletonHighlight: string;
}

export const lightColors: ThemeColors = {
    bg: '#F4F6F8',
    bg2: '#EAEDF0',
    card: '#FFFFFF',
    cardBorder: '#F0F0F0',
    text: '#1A1A1A',
    textSub: '#555555',
    textMuted: '#AAAAAA',
    textOnGreen: '#FFFFFF',
    input: '#F7F8FA',
    inputBorder: '#EAEAEA',
    divider: '#F5F5F5',
    iconBg: '#F0F0F0',
    green: palette.green,
    greenLight: palette.greenLight,
    purple: palette.purple,
    orange: palette.orange,
    red: palette.red,
    blue: palette.blue,
    headerBg: '#FFFFFF',
    headerText: '#1A1A1A',
    sidebarBg: palette.green,
    statusBar: 'dark-content',
    switchTrack: '#E0E0E0',
    switchThumb: '#FFF',
    shadowOpacity: 0.07,
    skeleton: '#E8E8E8',
    skeletonHighlight: '#F5F5F5',
};

export const darkColors: ThemeColors = {
    bg: '#0F1117',
    bg2: '#161B22',
    card: '#1C2230',
    cardBorder: '#252D3D',
    text: '#EAECF0',
    textSub: '#A0AABB',
    textMuted: '#5A6480',
    textOnGreen: '#FFFFFF',
    input: '#1E2535',
    inputBorder: '#2A3448',
    divider: '#252D3D',
    iconBg: '#1E2535',
    green: palette.green,
    greenLight: palette.greenLight,
    purple: palette.purple,
    orange: palette.orange,
    red: palette.red,
    blue: palette.blue,
    headerBg: '#161B22',
    headerText: '#EAECF0',
    sidebarBg: '#0F3D27',
    statusBar: 'light-content',
    switchTrack: '#2A3448',
    switchThumb: '#9BA3BB',
    shadowOpacity: 0.25,
    skeleton: '#1E2535',
    skeletonHighlight: '#252D3D',
};
