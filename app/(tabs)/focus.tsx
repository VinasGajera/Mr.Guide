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
  Platform,
  FlatList,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../../store/useStore';

import { useAudioPlayer } from 'expo-audio';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.78, 320);
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const NEON = '#39FF14';
const BREAK_COLOR = '#3b82f6';
const DURATIONS = [15, 25, 45, 60];

// Generate minute options 1-120
const MINUTE_OPTIONS = Array.from({ length: 120 }, (_, i) => i + 1);
const ITEM_HEIGHT = 52;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Duration Picker Modal ────────────────────────────────────────────────────
function DurationPickerModal({
  visible,
  currentMinutes,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  currentMinutes: number;
  onConfirm: (minutes: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentMinutes);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setSelected(currentMinutes);
      // Scroll to current value after modal opens
      setTimeout(() => {
        const index = MINUTE_OPTIONS.indexOf(currentMinutes);
        if (index >= 0 && listRef.current) {
          listRef.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
        }
      }, 100);
    }
  }, [visible, currentMinutes]);

  const renderItem = ({ item }: { item: number }) => {
    const isSelected = item === selected;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelected(item);
        }}
        activeOpacity={0.7}
        style={{
          height: ITEM_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: isSelected ? 42 : 26,
            fontWeight: isSelected ? '200' : '400',
            color: isSelected ? NEON : '#333',
            letterSpacing: isSelected ? 2 : 0,
          }}
        >
          {String(item).padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.96)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#080808',
            width: '100%',
            borderRadius: 32,
            borderWidth: 1,
            borderColor: 'rgba(57,255,20,0.18)',
            overflow: 'hidden',
            shadowColor: NEON,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: 28,
              paddingBottom: 8,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#111',
            }}
          >
            <Text
              style={{
                color: NEON,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Set Duration
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
              How long will you focus?
            </Text>
          </View>

          {/* Quick presets */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 16,
              paddingHorizontal: 20,
            }}
          >
            {DURATIONS.map((d) => {
              const isActive = selected === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    setSelected(d);
                    const index = MINUTE_OPTIONS.indexOf(d);
                    if (index >= 0 && listRef.current) {
                      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                    }
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isActive ? NEON : '#1e1e1e',
                    backgroundColor: isActive ? 'rgba(57,255,20,0.08)' : '#0d0d0d',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? NEON : '#444',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                    }}
                  >
                    {d}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scroll picker */}
          <View
            style={{
              height: ITEM_HEIGHT * 5,
              position: 'relative',
              marginHorizontal: 20,
              marginBottom: 8,
            }}
          >
            {/* Highlight band */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: ITEM_HEIGHT * 2,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: 'rgba(57,255,20,0.25)',
                backgroundColor: 'rgba(57,255,20,0.04)',
                borderRadius: 10,
                zIndex: 1,
              }}
            />

            <FlatList
              ref={listRef}
              data={MINUTE_OPTIONS}
              keyExtractor={(item) => String(item)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                const clamped = Math.max(0, Math.min(MINUTE_OPTIONS.length - 1, index));
                const newVal = MINUTE_OPTIONS[clamped];
                setSelected(newVal);
              }}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
            />
          </View>

          {/* Selected label */}
          <View style={{ alignItems: 'center', paddingBottom: 8 }}>
            <Text style={{ color: '#2a2a2a', fontSize: 13 }}>
              {selected} minute{selected !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#1e1e1e',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#444',
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontSize: 13,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onConfirm(selected);
              }}
              style={{
                flex: 2,
                paddingVertical: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: `${NEON}66`,
                backgroundColor: 'rgba(57,255,20,0.08)',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: NEON,
                  fontWeight: '800',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontSize: 14,
                }}
              >
                Set {selected}m
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
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
    completeBreak,
    setSelectedDuration,
  } = useStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const completedRef = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const ringProgress = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;

  const isBreak = pomodoro.phase === 'short-break' || pomodoro.phase === 'long-break';
  const ringColor = isBreak ? BREAK_COLOR : NEON;
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const totalSeconds = isBreak
    ? pomodoro.sessionDurationMinutes * 60
    : selectedDuration * 60;
  const progress = pomodoro.timeLeft / totalSeconds;

  const isActive = pomodoro.isRunning || pomodoro.isPaused;

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

  // ── Pulse animation when idle (hint to tap) ─────────────────────
  useEffect(() => {
    if (!isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
          Animated.timing(timerPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      timerPulse.setValue(1);
    }
  }, [isActive]);

  // ── AppState listener ────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
      setAppStateVisible(next);
    });
    return () => sub.remove();
  }, []);

  // ── Audio alarm (expo-audio) ─────────────────────────────────────
  // Classic alarm clock loop — plays on every session/break end
  const alarmPlayer = useAudioPlayer(
    { uri: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3' },
  );

  const playAlarm = () => {
    try {
      alarmPlayer.seekTo(0);
      alarmPlayer.loop = true;
      alarmPlayer.play();
      // Auto-stop after 6 seconds so it doesn't loop forever
      setTimeout(() => {
        try { alarmPlayer.pause(); } catch (_) {}
      }, 6000);
    } catch (e) {
      console.warn("Couldn't play alarm", e);
    }
  };

  const stopAlarm = () => {
    try { alarmPlayer.pause(); } catch (_) {}
  };

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSuccess = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    playAlarm();

    if (isBreak) {
      // Break ended — just reset the timer, task stays as-is
      completeBreak();
      completedRef.current = false;
      return;
    }

    // Focus session ended — automatically marks the linked task as done
    completePomodoro();
    setSelectedTaskId(null);
    setShowBreakPrompt(true);
    completedRef.current = false;
  }, [isBreak, completePomodoro, completeBreak]);

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

  const handleStart = async () => {
    if (!selectedTaskId) return;
    startPomodoro(selectedTaskId);
  };

  const handlePause = () => {
    pausePomodoro();
  };

  const handleResume = () => {
    resumePomodoro();
  };

  const handleGiveUpClick = () => {
    setShowFailModal(true);
  };

  // Mark task as done early (before timer runs out)
  const confirmDone = () => {
    setShowFailModal(false);
    completePomodoro();
    setSelectedTaskId(null);
    setShowBreakPrompt(true);
  };

  const confirmGiveUp = () => {
    stopAlarm();
    setShowFailModal(false);
    failPomodoro();
    setSelectedTaskId(null);
  };

  const handleStartBreak = (minutes: number, phase: 'short-break' | 'long-break') => {
    stopAlarm();
    setShowBreakPrompt(false);
    startBreak(minutes, phase);
  };

  const handleSkipBreak = () => {
    stopAlarm();
    setShowBreakPrompt(false);
  };

  const handleTimerPress = () => {
    if (isActive || isBreak) return; // don't allow changing while running
    setShowDurationPicker(true);
  };

  const handleDurationConfirm = (minutes: number) => {
    setSelectedDuration(minutes);
    setShowDurationPicker(false);
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
                  onPress={() => { setSelectedDuration(d); }}
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
        <TouchableOpacity
          onPress={handleTimerPress}
          activeOpacity={isActive || isBreak ? 1 : 0.85}
          disabled={isActive || isBreak}
        >
          <Animated.View
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              transform: [{ scale: timerPulse }],
            }}
          >
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
              {/* Tap hint when idle */}
              {!isActive && !isBreak && (
                <Text
                  style={{
                    color: '#222',
                    fontSize: 9,
                    fontWeight: '600',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginTop: 10,
                  }}
                >
                  tap to edit
                </Text>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>

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
                        onPress={() => { setSelectedTaskId(task.id); }}
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

          {/* Mark Done + Pause buttons — shown when actively running a focus session */}
          {pomodoro.isRunning && !isBreak && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={confirmDone}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: `${NEON}44`,
                  backgroundColor: 'rgba(57,255,20,0.06)',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: NEON }}>
                  Done ✓
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePause}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#2a2a2a',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#555' }}>
                  Pause
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Duration Picker Modal ──────────────────────────────────── */}
      <DurationPickerModal
        visible={showDurationPicker}
        currentMinutes={selectedDuration}
        onConfirm={handleDurationConfirm}
        onClose={() => setShowDurationPicker(false)}
      />

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

      {/* ── End Session Modal (Done or Give Up) ───────────────────── */}
      <Modal animationType="fade" transparent visible={showFailModal} onRequestClose={() => setShowFailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              backgroundColor: '#050505',
              width: '100%',
              padding: 32,
              borderRadius: 28,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#1a1a1a',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            <Text style={{ color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              {isBreak ? 'End break' : 'End session early'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>
              {isBreak ? 'End Break?' : 'How did it go?'}
            </Text>
            <Text style={{ color: '#444', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
              {isBreak
                ? 'Your break timer will stop.'
                : 'Choose what to do with this task.'}
            </Text>

            {/* Done option — only for focus sessions */}
            {!isBreak && (
              <TouchableOpacity
                onPress={confirmDone}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: `${NEON}55`,
                  backgroundColor: 'rgba(57,255,20,0.07)',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: NEON, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 14 }}>
                  ✓  Mark as Done
                </Text>
                <Text style={{ color: '#2a5a2a', fontSize: 11, marginTop: 4 }}>Task completed — well done!</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowFailModal(false)}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e1e1e', alignItems: 'center' }}
              >
                <Text style={{ color: '#444', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 }}>Return</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmGiveUp}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)', backgroundColor: 'rgba(220,38,38,0.06)', alignItems: 'center' }}
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
