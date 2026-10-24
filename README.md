# Mr.Guide 🎯

A focused productivity app built with **React Native** and **Expo** that combines Pomodoro-technique timers with a task manager and session statistics — all in a sleek dark UI.

---

## ✨ Features

### 🍅 Pomodoro Timer (Focus Screen)
- **Custom Duration Picker** — Scrollable drum-roll picker (1–120 min) with quick-access presets
- **Tap-to-Open** — Tap the timer ring to change duration on the fly
- **Pause & Resume** — Pause mid-session and continue exactly where you left off
- **Break Mode** — After a focus session, choose a 5-min short break or 15-min long break
- **Task Linking** — Attach a task to a session; it auto-completes when the timer ends
- **Fail / Give Up** — Abandon a session and mark the linked task as failed

### ✅ Task Manager (Tasks Screen)
- Add tasks with a title, optional description, and category
- Tasks have three statuses: **Pending**, **Completed**, **Failed**
- **Retry** failed tasks to reset them back to pending
- Delete tasks with a swipe or button

### 📊 Session Statistics (Stats Screen)
- Total completed Pomodoro sessions
- Total focused minutes logged
- Daily session streak counter
- Today's session count

### 🔔 Notifications
- Permission request modal on first launch (branded, with a "Not Now" option)
- Notification handler registered at the root layout level

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| [Expo](https://expo.dev) ~54 | App framework & build tooling |
| [Expo Router](https://expo.github.io/router) ~6 | File-based navigation |
| [React Native](https://reactnative.dev) 0.81 | Cross-platform UI |
| [Zustand](https://zustand-demo.pmnd.rs) ^5 | Global state management |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Persistent state storage |
| [NativeWind](https://www.nativewind.dev) ^4 | Tailwind CSS utility classes for RN |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Smooth animations |
| [React Native SVG](https://github.com/software-mansion/react-native-svg) | Timer ring SVG rendering |
| [expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/) | Session completion sounds |
| [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Local push notifications |
| TypeScript | Full type safety |

---

## 📁 Project Structure

```
Mr.Guide/
├── app/
│   ├── _layout.tsx          # Root layout, notification handler, permission modal
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator
│       ├── focus.tsx        # Pomodoro timer screen
│       ├── tasks.tsx        # Task manager screen
│       └── stats.tsx        # Session statistics screen
├── store/
│   └── useStore.ts          # Zustand store (tasks, pomodoro state, stats)
├── assets/                  # Icons, splash screen, images
├── app.json                 # Expo configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) or `npx`
- [Expo Go](https://expo.dev/client) app on your phone, **or** an Android/iOS simulator

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/VinasGajera/Mr.Guide.git
cd Mr.Guide

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

Then scan the QR code with Expo Go, or press `a` for Android / `i` for iOS simulator.

### Platform-specific commands

```bash
npm run android   # Launch on Android
npm run ios       # Launch on iOS
npm run web       # Launch in browser
```

---

## 📱 Screens

| Screen | Description |
|---|---|
| **Focus** | Pomodoro timer with duration picker, task linking, and break flow |
| **Tasks** | Full task list with add, retry, complete, and delete actions |
| **Stats** | Lifetime and daily session statistics with streak tracking |

---

## 🗂 State Management

All app state lives in a single **Zustand** store (`store/useStore.ts`), persisted to `AsyncStorage` under the key `mr-guide-storage-v2`.

Key state slices:

- **`tasks`** — Array of `Task` objects (`id`, `title`, `description`, `category`, `status`, `createdAt`)
- **`pomodoro`** — Timer state (`timeLeft`, `isRunning`, `isPaused`, `phase`, `endTime`, `sessionDurationMinutes`, `currentLinkedTaskId`)
- **`stats`** — Session statistics (`completedSessions`, `totalFocusedMinutes`, `currentStreak`, `todaySessions`)
- **`selectedDuration`** — The user-chosen focus duration (in minutes, default 25)
