import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore, TaskStatus } from '../../store/useStore';


const NEON = '#39FF14';

const CATEGORIES = ['All', 'Personal', 'Work', 'Study', 'Others'];

// Map of category → accent colour (left bar)
const CATEGORY_COLORS: Record<string, string> = {
  Personal: '#3b82f6',
  Work:     '#f59e0b',
  Study:    '#8b5cf6',
  Others:   '#ec4899',
};

type TaskCardProps = {
  task: ReturnType<typeof useStore.getState>['tasks'][number];
  onToggle: () => void;
  onDelete: () => void;
  index: number;
};

function TaskCard({ task, onToggle, onDelete, index }: TaskCardProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const swipeRef  = useRef<Swipeable>(null);

  const isCompleted = task.status === 'completed';
  const isFailed    = task.status === 'failed';
  const accentColor = CATEGORY_COLORS[task.category || ''] || '#333';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 11,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderRightAction = () => (
    <TouchableOpacity
      onPress={() => {
        swipeRef.current?.close();
        onDelete();
      }}
      style={{
        backgroundColor: '#1a0000',
        borderRadius: 18,
        marginBottom: 12,
        marginLeft: 10,
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.3)',
      }}
    >
      <Text style={{ color: '#dc2626', fontSize: 18 }}>✕</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightAction}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onToggle}
          style={{
            flexDirection: 'row',
            backgroundColor: isFailed ? '#080808' : '#0d0d0d',
            borderRadius: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: isCompleted
              ? 'rgba(57,255,20,0.15)'
              : isFailed
              ? 'rgba(220,38,38,0.1)'
              : '#1a1a1a',
            overflow: 'hidden',
            opacity: isFailed ? 0.55 : 1,
            shadowColor: isCompleted ? NEON : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isCompleted ? 0.06 : 0.2,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* Category accent bar */}
          <View
            style={{
              width: 4,
              backgroundColor: isCompleted
                ? NEON
                : isFailed
                ? '#dc2626'
                : accentColor,
              opacity: isCompleted ? 0.7 : isFailed ? 0.4 : 0.9,
              borderTopLeftRadius: 18,
              borderBottomLeftRadius: 18,
            }}
          />

          {/* Card body */}
          <View style={{ flex: 1, paddingVertical: 18, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: isCompleted ? '#3d3d3d' : isFailed ? '#3d1515' : '#fff',
                    fontSize: 17,
                    fontWeight: '700',
                    letterSpacing: -0.3,
                    marginBottom: 5,
                    textDecorationLine: isCompleted || isFailed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {task.category && (
                    <Text
                      style={{
                        color: isCompleted ? '#2a2a2a' : accentColor,
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        opacity: isCompleted ? 0.5 : 0.7,
                      }}
                    >
                      {task.category}
                    </Text>
                  )}
                  {task.description && (
                    <>
                      <Text style={{ color: '#222', fontSize: 10 }}>·</Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: '#444', fontSize: 13, flex: 1 }}
                      >
                        {task.description}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Checkbox */}
              <TouchableOpacity
                onPress={onToggle}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: isCompleted ? NEON : isFailed ? '#2a0a0a' : '#2a2a2a',
                  backgroundColor: isCompleted ? 'rgba(57,255,20,0.08)' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCompleted && (
                  <Text style={{ color: NEON, fontSize: 14, lineHeight: 16 }}>✓</Text>
                )}
                {isFailed && (
                  <Text style={{ color: '#3d1010', fontSize: 12, lineHeight: 14 }}>✕</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const { tasks, addTask, updateTaskStatus, removeTask } = useStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Personal');

  // Header fade-in
  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const doneCount    = tasks.filter((t) => t.status === 'completed').length;

  const filteredTasks = tasks
    .filter((task) => (activeCategory === 'All' ? true : task.category === activeCategory))
    .sort((a, b) => {
      const order = { pending: 0, completed: 1, failed: 2 };
      return order[a.status] - order[b.status];
    });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      category: newTaskCategory,
    });
    setModalVisible(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskCategory('Personal');
  };

  const handleToggle = (id: string, status: TaskStatus) => {
    if (status === 'completed') updateTaskStatus(id, 'pending');
    else if (status === 'failed') updateTaskStatus(id, 'pending');
    else updateTaskStatus(id, 'completed');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 60 }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <Animated.View style={{ opacity: headerFade, paddingHorizontal: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Mr.Guide
            </Text>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>
              Your Tasks
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setModalVisible(true);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: 'rgba(57,255,20,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(57,255,20,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: NEON,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
            }}
          >
            <Text style={{ color: NEON, fontSize: 22, lineHeight: 24, marginTop: -2 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View style={{ backgroundColor: '#0d0d0d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#1a1a1a', flex: 1 }}>
            <Text style={{ color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Pending</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{pendingCount}</Text>
          </View>
          <View style={{ backgroundColor: '#0d0d0d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(57,255,20,0.1)', flex: 1 }}>
            <Text style={{ color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Done</Text>
            <Text style={{ color: NEON, fontSize: 24, fontWeight: '800', marginTop: 2 }}>{doneCount}</Text>
          </View>
          <View style={{ backgroundColor: '#0d0d0d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#1a1a1a', flex: 1 }}>
            <Text style={{ color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Total</Text>
            <Text style={{ color: '#666', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{tasks.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Category pills ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 4 }}
        style={{ maxHeight: 48, marginBottom: 16 }}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => { setActiveCategory(cat); }}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: active ? NEON : '#1e1e1e',
                backgroundColor: active ? 'rgba(57,255,20,0.07)' : '#0d0d0d',
              }}
            >
              <Text style={{ color: active ? NEON : '#444', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Task list ─────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: '#1a1a1a', fontSize: 48, marginBottom: 16 }}>◻</Text>
            <Text style={{ color: '#333', fontSize: 17, fontWeight: '600' }}>
              {activeCategory === 'All' ? 'No tasks yet' : `No ${activeCategory} tasks`}
            </Text>
            <Text style={{ color: '#222', fontSize: 14, marginTop: 6 }}>
              Tap + to add your first one
            </Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onToggle={() => handleToggle(task.id, task.status)}
              onDelete={() => removeTask(task.id)}
            />
          ))
        )}
      </ScrollView>

      {/* ── Add Task Bottom Sheet ─────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
          />
          <View
            style={{
              backgroundColor: '#080808',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 28,
              paddingBottom: 44,
              borderTopWidth: 1,
              borderColor: '#1a1a1a',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.6,
              shadowRadius: 24,
              elevation: 30,
            }}
          >
            {/* Drag handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#222', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#444', fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="What needs to be done?"
              placeholderTextColor="#2a2a2a"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              selectionColor={NEON}
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: '700',
                borderBottomWidth: 1,
                borderBottomColor: newTaskTitle ? 'rgba(57,255,20,0.3)' : '#1a1a1a',
                paddingBottom: 12,
                marginBottom: 20,
              }}
            />

            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#222"
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              selectionColor={NEON}
              style={{
                color: '#555',
                fontSize: 15,
                marginBottom: 28,
                minHeight: 40,
              }}
            />

            <Text style={{ color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                const active = newTaskCategory === cat;
                const accent = CATEGORY_COLORS[cat] || '#555';
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { setNewTaskCategory(cat); }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 50,
                      borderWidth: 1,
                      borderColor: active ? accent : '#1e1e1e',
                      backgroundColor: active ? `${accent}15` : '#0d0d0d',
                    }}
                  >
                    <Text style={{ color: active ? accent : '#444', fontSize: 14, fontWeight: '700' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleCreateTask}
              activeOpacity={0.85}
              style={{
                paddingVertical: 17,
                borderRadius: 18,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: newTaskTitle.trim() ? 'rgba(57,255,20,0.4)' : '#1a1a1a',
                backgroundColor: newTaskTitle.trim() ? 'rgba(57,255,20,0.07)' : '#0d0d0d',
                shadowColor: newTaskTitle.trim() ? NEON : 'transparent',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 14,
              }}
            >
              <Text
                style={{
                  color: newTaskTitle.trim() ? NEON : '#2a2a2a',
                  fontSize: 15,
                  fontWeight: '800',
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                }}
              >
                Create Task
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
