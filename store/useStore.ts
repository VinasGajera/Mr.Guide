import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TaskStatus = 'pending' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  createdAt: number;
}

export type PomodoroPhase = 'idle' | 'focus' | 'short-break' | 'long-break';

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  phase: PomodoroPhase;
  currentLinkedTaskId: string | null;
  endTime: number | null;
  sessionDurationMinutes: number;
}

export interface SessionStats {
  completedSessions: number;
  totalFocusedMinutes: number;
  currentStreak: number;
  lastSessionDate: string | null;
  todaySessions: number;
  lastSessionDay: string | null;
}

interface AppState {
  tasks: Task[];
  pomodoro: PomodoroState;
  stats: SessionStats;
  selectedDuration: number; // minutes

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;

  // Pomodoro Actions
  setPomodoroState: (state: Partial<PomodoroState>) => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;
  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  startBreak: (minutes: number, phase: 'short-break' | 'long-break') => void;
  failPomodoro: () => void;
  completePomodoro: () => void;
  setSelectedDuration: (minutes: number) => void;
}

const toDateKey = (ts: number) => new Date(ts).toISOString().split('T')[0];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      pomodoro: {
        timeLeft: 25 * 60,
        isRunning: false,
        isPaused: false,
        phase: 'idle',
        currentLinkedTaskId: null,
        endTime: null,
        sessionDurationMinutes: 25,
      },
      stats: {
        completedSessions: 0,
        totalFocusedMinutes: 0,
        currentStreak: 0,
        lastSessionDate: null,
        todaySessions: 0,
        lastSessionDay: null,
      },
      selectedDuration: 25,

      // ── Task Actions ──────────────────────────────────────────────
      addTask: (taskData) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...taskData,
              id: Date.now().toString(),
              status: 'pending',
              createdAt: Date.now(),
            },
          ],
        })),

      updateTaskStatus: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, status } : task
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      // ── Pomodoro Actions ─────────────────────────────────────────
      setPomodoroState: (newState) =>
        set((state) => ({
          pomodoro: { ...state.pomodoro, ...newState },
        })),

      tickPomodoro: () =>
        set((state) => {
          if (!state.pomodoro.isRunning || !state.pomodoro.endTime) return state;
          const now = Date.now();
          const diffInSeconds = Math.ceil((state.pomodoro.endTime - now) / 1000);
          if (diffInSeconds <= 0) {
            return {
              ...state,
              pomodoro: { ...state.pomodoro, timeLeft: 0, isRunning: false },
            };
          }
          return {
            ...state,
            pomodoro: { ...state.pomodoro, timeLeft: diffInSeconds },
          };
        }),

      resetPomodoro: () =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            timeLeft: state.selectedDuration * 60,
            isRunning: false,
            isPaused: false,
            phase: 'idle',
            endTime: null,
            currentLinkedTaskId: null,
          },
        })),

      startPomodoro: (taskId) =>
        set((state) => {
          const durationSeconds = state.selectedDuration * 60;
          return {
            pomodoro: {
              ...state.pomodoro,
              timeLeft: durationSeconds,
              isRunning: true,
              isPaused: false,
              phase: 'focus',
              currentLinkedTaskId: taskId,
              endTime: Date.now() + durationSeconds * 1000,
              sessionDurationMinutes: state.selectedDuration,
            },
          };
        }),

      pausePomodoro: () =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isRunning: false,
            isPaused: true,
            endTime: null,
          },
        })),

      resumePomodoro: () =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isRunning: true,
            isPaused: false,
            endTime: Date.now() + state.pomodoro.timeLeft * 1000,
          },
        })),

      startBreak: (minutes, phase) =>
        set((state) => {
          const durationSeconds = minutes * 60;
          return {
            pomodoro: {
              ...state.pomodoro,
              timeLeft: durationSeconds,
              isRunning: true,
              isPaused: false,
              phase,
              currentLinkedTaskId: null,
              endTime: Date.now() + durationSeconds * 1000,
              sessionDurationMinutes: minutes,
            },
          };
        }),

      failPomodoro: () =>
        set((state) => {
          const taskId = state.pomodoro.currentLinkedTaskId;
          return {
            pomodoro: {
              ...state.pomodoro,
              timeLeft: state.selectedDuration * 60,
              isRunning: false,
              isPaused: false,
              phase: 'idle',
              currentLinkedTaskId: null,
              endTime: null,
            },
            tasks: taskId
              ? state.tasks.map((t) =>
                  t.id === taskId ? { ...t, status: 'failed' } : t
                )
              : state.tasks,
          };
        }),

      completePomodoro: () =>
        set((state) => {
          const taskId = state.pomodoro.currentLinkedTaskId;
          const now = Date.now();
          const todayKey = toDateKey(now);
          const prevDay = state.stats.lastSessionDay;

          // Calculate streak
          const yesterday = toDateKey(now - 86400000);
          const streakContinues = prevDay === yesterday || prevDay === todayKey;
          const newStreak = streakContinues ? state.stats.currentStreak + 1 : 1;

          // Today's sessions
          const newTodaySessions =
            state.stats.lastSessionDay === todayKey
              ? state.stats.todaySessions + 1
              : 1;

          return {
            pomodoro: {
              ...state.pomodoro,
              timeLeft: state.selectedDuration * 60,
              isRunning: false,
              isPaused: false,
              phase: 'idle',
              currentLinkedTaskId: null,
              endTime: null,
            },
            stats: {
              completedSessions: state.stats.completedSessions + 1,
              totalFocusedMinutes:
                state.stats.totalFocusedMinutes + state.pomodoro.sessionDurationMinutes,
              currentStreak: newStreak,
              lastSessionDate: new Date(now).toISOString(),
              todaySessions: newTodaySessions,
              lastSessionDay: todayKey,
            },
            tasks: taskId
              ? state.tasks.map((t) =>
                  t.id === taskId ? { ...t, status: 'completed' } : t
                )
              : state.tasks,
          };
        }),

      setSelectedDuration: (minutes) =>
        set((state) => ({
          selectedDuration: minutes,
          pomodoro: {
            ...state.pomodoro,
            timeLeft: minutes * 60,
            sessionDurationMinutes: minutes,
          },
        })),
    }),
    {
      name: 'mr-guide-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
