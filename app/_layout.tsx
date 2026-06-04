import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NEON = '#39FF14';
const PERM_KEY = 'mr_guide_notif_asked';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function NotificationPermissionModal({
  visible,
  onAllow,
  onDeny,
}: {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            backgroundColor: '#070707',
            borderRadius: 32,
            padding: 32,
            borderWidth: 1,
            borderColor: 'rgba(57,255,20,0.15)',
            shadowColor: NEON,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 40,
            elevation: 20,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: 'rgba(57,255,20,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(57,255,20,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 30 }}>🔔</Text>
          </View>

          {/* Label */}
          <Text
            style={{
              color: NEON,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 3,
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Mr.Guide
          </Text>

          {/* Title */}
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            Stay on Track
          </Text>

          {/* Body */}
          <Text
            style={{
              color: '#555',
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            Allow Mr.Guide to send you notifications when your focus session or break ends,
            so you never lose momentum.
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            onPress={onAllow}
            activeOpacity={0.82}
            style={{
              paddingVertical: 17,
              borderRadius: 18,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: `${NEON}55`,
              backgroundColor: 'rgba(57,255,20,0.08)',
              marginBottom: 10,
              shadowColor: NEON,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          >
            <Text
              style={{
                color: NEON,
                fontSize: 15,
                fontWeight: '800',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Allow Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDeny}
            activeOpacity={0.7}
            style={{
              paddingVertical: 14,
              borderRadius: 18,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#333',
                fontSize: 13,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Not Now
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function RootLayout() {
  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    (async () => {
      const alreadyAsked = await AsyncStorage.getItem(PERM_KEY);
      if (alreadyAsked) return;
      // Small delay so the app renders first
      setTimeout(() => setShowPermModal(true), 600);
    })();
  }, []);

  const handleAllow = async () => {
    setShowPermModal(false);
    await AsyncStorage.setItem(PERM_KEY, 'true');
    await Notifications.requestPermissionsAsync();
  };

  const handleDeny = async () => {
    setShowPermModal(false);
    await AsyncStorage.setItem(PERM_KEY, 'true');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      <NotificationPermissionModal
        visible={showPermModal}
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
    </GestureHandlerRootView>
  );
}
