import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useStore } from '../../store/useStore';

const NEON = '#39FF14';

// ── Animated SVG circle for the donut chart ───────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING = 64;
const STROKE = 7;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function DonutRing({ value, color }: { value: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <Svg width={RING} height={RING}>
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={R}
        stroke="#1a1a1a"
        strokeWidth={STROKE}
        fill="transparent"
      />
      <AnimatedCircle
        cx={RING / 2}
        cy={RING / 2}
        r={R}
        stroke={color}
        strokeWidth={STROKE}
        fill="transparent"
        strokeDasharray={CIRC}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        originX={RING / 2}
        originY={RING / 2}
      />
    </Svg>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  index: number;
}) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 60, friction: 10, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: slide }],
        flex: 1,
        backgroundColor: '#0d0d0d',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        shadowColor: accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>
        {value}
      </Text>
      {sub && (
        <Text style={{ color: '#444', fontSize: 12, marginTop: 4 }}>{sub}</Text>
      )}
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { tasks, stats } = useStore();

  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const completed  = tasks.filter((t) => t.status === 'completed').length;
  const failed     = tasks.filter((t) => t.status === 'failed').length;
  const total      = tasks.length;
  const successRate = total > 0 ? completed / total : 0;

  const hours   = Math.floor(stats.totalFocusedMinutes / 60);
  const minutes = stats.totalFocusedMinutes % 60;
  const focusLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 60 }}>
      <Animated.View style={{ opacity: headerFade, paddingHorizontal: 24, marginBottom: 28 }}>
        <Text style={{ color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Mr.Guide
        </Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>
          Your Stats
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero metric: streak ────────────────────────────────── */}
        {stats.currentStreak > 0 ? (
          <Animated.View
            style={{
              opacity: headerFade,
              backgroundColor: '#080f08',
              borderRadius: 24,
              padding: 28,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(57,255,20,0.2)',
              shadowColor: NEON,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ color: 'rgba(57,255,20,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Current Streak
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: NEON, fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>
                  {stats.currentStreak}
                </Text>
                <Text style={{ color: 'rgba(57,255,20,0.5)', fontSize: 18, fontWeight: '700' }}>
                  {stats.currentStreak === 1 ? 'day' : 'days'}
                </Text>
              </View>
              <Text style={{ color: '#333', fontSize: 13, marginTop: 4 }}>
                Keep the momentum going 🔥
              </Text>
            </View>
            <Text style={{ fontSize: 52 }}>🔥</Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              opacity: headerFade,
              backgroundColor: '#0d0d0d',
              borderRadius: 24,
              padding: 28,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#1a1a1a',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#222', fontSize: 40, marginBottom: 12 }}>◎</Text>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
              No streak yet
            </Text>
            <Text style={{ color: '#222', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Complete a Focus session to start your streak
            </Text>
          </Animated.View>
        )}

        {/* ── Row: sessions + focus time ─────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard
            label="Sessions"
            value={`${stats.completedSessions}`}
            sub="completed"
            accent="#8b5cf6"
            index={1}
          />
          <StatCard
            label="Focus Time"
            value={focusLabel || '0m'}
            sub="total"
            accent="#3b82f6"
            index={2}
          />
        </View>

        {/* ── Success rate ring ─────────────────────────────────── */}
        <Animated.View
          style={{
            opacity: headerFade,
            backgroundColor: '#0d0d0d',
            borderRadius: 20,
            padding: 24,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#1a1a1a',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <DonutRing value={successRate} color={successRate > 0.7 ? NEON : successRate > 0.4 ? '#f59e0b' : '#dc2626'} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Success Rate
            </Text>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>
              {total > 0 ? `${Math.round(successRate * 100)}%` : '—'}
            </Text>
            <Text style={{ color: '#333', fontSize: 12, marginTop: 4 }}>
              {completed} completed · {failed} failed
            </Text>
          </View>
        </Animated.View>

        {/* ── Today's sessions ──────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard
            label="Today"
            value={`${stats.todaySessions}`}
            sub="sessions done"
            accent={NEON}
            index={3}
          />
          <StatCard
            label="Total Tasks"
            value={`${total}`}
            sub={`${tasks.filter(t => t.status === 'pending').length} pending`}
            accent="#f59e0b"
            index={4}
          />
        </View>

        {/* ── Empty state when zero data ────────────────────────── */}
        {stats.completedSessions === 0 && (
          <View
            style={{
              backgroundColor: '#080808',
              borderRadius: 20,
              padding: 28,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#111',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#1a1a1a', fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Nothing here yet
            </Text>
            <Text style={{ color: '#222', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Complete your first Focus session to start tracking your productivity.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
