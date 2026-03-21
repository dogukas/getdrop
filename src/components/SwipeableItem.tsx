import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

interface SwipeableItemProps {
    children: React.ReactNode;
    onSwipeRight?: () => void; // Onayla / Tamamla
    onSwipeLeft?: () => void;  // İptal / Sil
    rightLabel?: string;
    leftLabel?: string;
}

export default function SwipeableItem({ children, onSwipeRight, onSwipeLeft, rightLabel = 'Tamamla', leftLabel = 'İptal' }: SwipeableItemProps) {
    const translateX = useSharedValue(0);
    const hasTriggered = useSharedValue(false);
    const startX = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onStart(() => {
            startX.value = translateX.value;
            hasTriggered.value = false;
        })
        .onUpdate((event) => {
            let nextVal = startX.value + event.translationX;

            if (!onSwipeRight && nextVal > 0) nextVal = 0;
            if (!onSwipeLeft && nextVal < 0) nextVal = 0;

            translateX.value = nextVal;

            if (Math.abs(event.translationX) > SWIPE_THRESHOLD && !hasTriggered.value) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                hasTriggered.value = true;
            } else if (Math.abs(event.translationX) <= SWIPE_THRESHOLD && hasTriggered.value) {
                hasTriggered.value = false;
            }
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD && onSwipeRight) {
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                if (onSwipeRight) runOnJS(onSwipeRight)();
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            } else if (event.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
                if (onSwipeLeft) runOnJS(onSwipeLeft)();
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            } else {
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            }
        });

    const rStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    const lBgStyle = useAnimatedStyle(() => {
        const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP);
        return { opacity };
    });

    const rBgStyle = useAnimatedStyle(() => {
        const opacity = interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP);
        return { opacity };
    });

    return (
        <View style={s.container}>
            {/* Arka plan butonları */}
            <View style={s.background}>
                <Animated.View style={[s.bgSide, s.bgLeft, lBgStyle]}>
                    <Icon source="check-circle" size={24} color="white" />
                    <Text style={s.bgText}>{rightLabel}</Text>
                </Animated.View>
                <Animated.View style={[s.bgSide, s.bgRight, rBgStyle]}>
                    <Icon source="close-circle" size={24} color="white" />
                    <Text style={s.bgText}>{leftLabel}</Text>
                </Animated.View>
            </View>

            {/* Ön yüz: Sürüklenen asıl içerik */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[s.front, rStyle]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        marginBottom: 12, // Liste aralıkları için default
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    bgSide: {
        width: width * 0.4,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 8,
    },
    bgLeft: {
        backgroundColor: '#2A7A50',
        justifyContent: 'flex-start',
    },
    bgRight: {
        backgroundColor: '#E05C5C',
        justifyContent: 'flex-end',
    },
    bgText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    front: {
        width: '100%',
    }
});
