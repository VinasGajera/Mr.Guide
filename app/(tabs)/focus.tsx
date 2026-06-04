import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  AppState,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../../store/useStore';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.78, 320);
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const NEON = '#39FF14';
const BREAK_COLOR = '#3b82f6';
const DURATIONS = [15, 25, 45, 60];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FocusScreen() {
  const {
    pomodoro,
    tasks,
    stats,
    selectedDuration,
    tickPomodoro,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    startBreak,
    failPomodoro,
    completePomodoro,
    setSelectedDuration,
  } = useStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const completedRef = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const ringProgress = useRef(new Animated.Value(1)).current;

  const isBreak = pomodoro.phase === 'short-break' || pomodoro.phase === 'long-break';
  const ringColor = isBreak ? BREAK_COLOR : NEON;
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const totalSeconds = isBreak
    ? pomodoro.sessionDurationMinutes * 60
    : selectedDuration * 60;
  const progress = pomodoro.timeLeft / totalSeconds;

  // ── Entrance animation ──────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Smooth ring animation ────────────────────────────────────────
  useEffect(() => {
    Animated.timing(ringProgress, {
      toValue: progress,
      duration: 950,
      useNativeDriver: false,
    }).start();
  }, [pomodoro.timeLeft]);

  // ── Notification permission ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') await Notifications.requestPermissionsAsync();
    })();
  }, []);

  // ── AppState listener ────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
      setAppStateVisible(next);
    });
    return () => sub.remove();
  }, []);

  // ── Cleanup sound ────────────────────────────────────────────────
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // ── Handlers ─────────────────────────────────────────────────────
  const playSuccessChime = async () => {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3' }
      );
      setSound(s);
      await s.playAsync();
    } catch (e) {
      console.warn("Couldn't play sound", e);
    }
  };

  const handleSuccess = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (isBreak) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completePomodoro();
      completedRef.current = false;
      return;
    }

    await playSuccessChime();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completePomodoro();
    setSelectedTaskId(null);
    setShowBreakPrompt(true);
    completedRef.current = false;
  }, [isBreak, completePomodoro]);

  // ── Timer tick ───────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoro.isRunning && pomodoro.timeLeft > 0 && appStateVisible === 'active') {
      interval = setInterval(tickPomodoro, 1000);
    } else if (pomodoro.isRunning && pomodoro.timeLeft === 0) {
      handleSuccess();
    }
    return () => clearInterval(interval);
  }, [pomodoro.isRunning, pomodoro.timeLeft, appStateVisible, handleSuccess]);

  const scheduleNotification = async (label: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isBreak ? 'Break over!' : 'Focus Complete!',
        body: isBreak ? 'Time to get back to work.' : `You finished: ${label}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: isBreak ? pomodoro.sessionDurationMinutes * 60 : selectedDuration * 60,
      },
    });
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const taskTitle = tasks.find((t) => t.id === selectedTaskId)?.title || 'Task';
    startPomodoro(selectedTaskId);
    await scheduleNotification(taskTitle);
  };

  const handlePause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Notifications.cancelAllScheduledNotificationsAsync();
    pausePomodoro();
  };

  const handleResume = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumePomodoro();
    const label = tasks.find((t) => t.id === pomodoro.currentLinkedTaskId)?.title || 'Task';
    await scheduleNotification(label);
  };

  const handleGiveUpClick = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowFailModal(true);
  };

  const confirmGiveUp = async () => {
    setShowFailModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await Notifications.cancelAllScheduledNotificationsAsync();
    failPomodoro();
    setSelectedTaskId(null);
  };

  const handleStartBreak = async (minutes: number, phase: 'short-break' | 'long-break') => {
    setShowBreakPrompt(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startBreak(minutes, phase);
    await scheduleNotification('break');
  };

  const handleSkipBreak = () => {
    setShowBreakPrompt(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTask = tasks.find((t) => t.id === pomodoro.currentLinkedTaskId);

  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const isActive = pomodoro.isRunning || pomodoro.isPaused;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: '#000',
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
            {isBreak ? 'Break' : 'Focus'}
          </Text>
          {stats.todaySessions > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(57,255,20,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(57,255,20,0.3)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: NEON, fontSize: 14 }}>⚡</Text>
              <Text style={{ color: NEON, fontSize: 13, fontWeight: '700' }}>
                {stats.todaySessions} today
              </Text>
            </View>
          )}
        </View>

        {/* Duration selector — only show when idle */}
        {!isActive && !isBreak && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28, marginTop: 4 }}>
            {DURATIONS.map((d) => {
              const active = selectedDuration === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => { Haptics.selectionAsync(); setSelectedDuration(d); }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 50,
                    borderWidth: 1,
                    borderColor: active ? NEON : '#2a2a2a',
                    backgroundColor: active ? 'rgba(57,255,20,0.08)' : '#0d0d0d',
                    shadowColor: active ? NEON : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: active ? 0.35 : 0,
                    shadowRadius: 10,
                    elevation: active ? 6 : 0,
                  }}
                >
                  <Text style={{ color: active ? NEON : '#555', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                    {d}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Break phase label */}
        {isBreak && (
          <View style={{ marginBottom: 16, marginTop: 4 }}>
            <Text style={{ color: BREAK_COLOR, fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
              {pomodoro.phase === 'short-break' ? '5-minute short break' : '15-minute long break'}
            </Text>
          </View>
        )}

        {/* ── Timer ring ─────────────────────────────────────────── */}
        <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#1a1a1a"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={isActive ? ringColor : '#2a2a2a'}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              originX={RING_SIZE / 2}
              originY={RING_SIZE / 2}
            />
          </Svg>

          <View
            style={{
              width: RING_SIZE - STROKE_WIDTH * 6,
              height: RING_SIZE - STROKE_WIDTH * 6,
              borderRadius: 9999,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: isActive ? ringColor : '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isActive ? 0.25 : 0.5,
              shadowRadius: isActive ? 30 : 20,
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontSize: 64,
                fontWeight: '200',
                letterSpacing: 3,
                color: isActive ? ringColor : '#fff',
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatTime(pomodoro.timeLeft)}
            </Text>
            <Text
              style={{
                color: isActive ? `${ringColor}99` : '#333',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginTop: 6,
              }}
            >
              {pomodoro.isPaused
                ? 'PAUSED'
                : pomodoro.isRunning
                ? isBreak
                  ? 'BREAK'
                  : activeTask?.title?.substring(0, 18) || 'FOCUSING'
                : isBreak
                ? 'BREAK'
                : `${selectedDuration} MIN`}
            </Text>
          </View>
        </View>

        {/* ── Task selector / active task / break info ──────────── */}
        <View style={{ width: '100%', flex: 1, minHeight: 120 }}>
          {isBreak ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#444', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Rest your eyes. Step away from the screen.{'\n'}You earned it.
              </Text>
            </View>
          ) : !isActive ? (
            <>
              <Text
                style={{
                  color: '#444',
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  paddingLeft: 4,
                }}
              >
                Choose a task to lock in
              </Text>

              {pendingTasks.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#0d0d0d',
                    borderRadius: 16,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#1a1a1a',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#2a2a2a', fontSize: 32, marginBottom: 8 }}>◻</Text>
                  <Text style={{ color: '#444', fontSize: 15, textAlign: 'center' }}>No pending tasks</Text>
                  <Text style={{ color: '#2a2a2a', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                    Add some from the Tasks tab
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20, gap: 12 }}
                >
                  {pendingTasks.map((task) => {
                    const isSelected = selectedTaskId === task.id;
                    return (
                      <TouchableOpacity
                        key={task.id}
                        onPress={() => { Haptics.selectionAsync(); setSelectedTaskId(task.id); }}
                        style={{
                          width: 200,
                          padding: 18,
                          borderRadius: 18,
                          backgroundColor: isSelected ? '#081208' : '#0d0d0d',
                          borderWidth: 1,
                          borderColor: isSelected ? NEON : '#1a1a1a',
                          shadowColor: isSelected ? NEON : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isSelected ? 0.25 : 0,
                          shadowRadius: 12,
                          elevation: isSelected ? 8 : 0,
                        }}
                      >
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSelected ? NEON : '#333', marginBottom: 10 }} />
                        <Text
                          style={{ color: isSelected ? NEON : '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 }}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={{ color: '#555', fontSize: 13 }} numberOfLines={2}>{task.description}</Text>
                        )}
                        {task.category && (
                          <Text style={{ color: '#333', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 10 }}>
                            {task.category}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                {pomodoro.isPaused ? 'Paused on' : 'Locking in on'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 }}>
                {activeTask?.title || '—'}
              </Text>
              {activeTask?.category && (
                <Text style={{ color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 }}>
                  {activeTask.category}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── CTA Buttons ─────────────────────────────────────────── */}
        <View style={{ width: '100%', marginTop: 24, gap: 12 }}>
          {/* Primary action button */}
          <TouchableOpacity
            onPress={
              isBreak
                ? handleGiveUpClick
                : pomodoro.isPaused
                ? handleResume
                : pomodoro.isRunning
                ? handleGiveUpClick
                : handleStart
            }
            disabled={!isActive && !isBreak && !selectedTaskId}
            activeOpacity={0.82}
            style={{
              paddingVertical: 18,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor:
                isBreak || pomodoro.isRunning
                  ? 'rgba(220,38,38,0.5)'
                  : pomodoro.isPaused
                  ? `${NEON}66`
                  : !selectedTaskId
                  ? '#1a1a1a'
                  : `${NEON}66`,
              shadowColor:
                isBreak || pomodoro.isRunning
                  ? '#dc2626'
                  : pomodoro.isPaused || selectedTaskId
                  ? NEON
                  : 'transparent',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: isActive || selectedTaskId ? 8 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: 3,
                textTransform: 'uppercase',
                color:
                  isBreak || pomodoro.isRunning
                    ? '#dc2626'
                    : pomodoro.isPaused
                    ? NEON
                    : !selectedTaskId
                    ? '#2a2a2a'
                    : '#fff',
              }}
            >
              {isBreak
                ? 'End Break'
                : pomodoro.isPaused
                ? 'Resume'
                : pomodoro.isRunning
                ? 'Give Up'
                : 'Start Focus'}
            </Text>
          </TouchableOpacity>

          {/* Pause button — only shown when actively running a focus session */}
          {pomodoro.isRunning && !isBreak && (
            <TouchableOpacity
              onPress={handlePause}
              activeOpacity={0.82}
              style={{
                paddingVertical: 14,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#2a2a2a',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#555' }}>
                Pause
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Break Prompt Modal ─────────────────────────────────────── */}
      <Modal animationType="fade" transparent visible={showBreakPrompt} onRequestClose={handleSkipBreak}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              backgroundColor: '#080f08',
              width: '100%',
              padding: 32,
              borderRadius: 28,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(57,255,20,0.25)',
              shadowColor: NEON,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            <Text style={{ color: NEON, fontSize: 36, marginBottom: 8 }}>✓</Text>
            <Text style={{ color: NEON, fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Session complete
            </Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 }}>
              Take a break?
            </Text>
            <Text style={{ color: '#444', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
              You've earned it. A short break helps you recharge before the next session.
            </Text>

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleStartBreak(5, 'short-break')}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: `${BREAK_COLOR}55`,
                  backgroundColor: `${BREAK_COLOR}10`,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: BREAK_COLOR, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 14 }}>
                  5-min Short Break
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStartBreak(15, 'long-break')}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: `${BREAK_COLOR}33`,
                  backgroundColor: `${BREAK_COLOR}08`,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: `${BREAK_COLOR}bb`, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 14 }}>
                  15-min Long Break
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSkipBreak}
                style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#444', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 }}>
                  Skip Break
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Failure Modal ─────────────────────────────────────────── */}
      <Modal animationType="fade" transparent visible={showFailModal} onRequestClose={() => setShowFailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              backgroundColor: '#050000',
              width: '100%',
              padding: 32,
              borderRadius: 28,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(220,38,38,0.3)',
              shadowColor: '#dc2626',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              {isBreak ? 'End break' : 'Focus broken'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>
              {isBreak ? 'End Early?' : 'Task Failed.'}
            </Text>
            <Text style={{ color: '#444', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
              {isBreak
                ? 'Your break timer will stop.'
                : 'Quitting now will mark this task as failed. Are you sure?'}
            </Text>

            <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowFailModal(false)}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#222', alignItems: 'center' }}
              >
                <Text style={{ color: '#555', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 }}>Return</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmGiveUp}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220,38,38,0.5)', backgroundColor: 'rgba(220,38,38,0.08)', alignItems: 'center' }}
              >
                <Text style={{ color: '#dc2626', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 }}>
                  {isBreak ? 'End Break' : 'Give Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
