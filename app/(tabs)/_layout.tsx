import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const NEON = '#39FF14';
const INACTIVE = '#444';

type TabIconProps = {
  color: string;
  label: string;
  glyph: string;
};

function TabIcon({ color, label, glyph }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Text style={{ color, fontSize: 20, lineHeight: 22 }}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050505',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: NEON,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} label="Tasks" glyph="▣" />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} label="Focus" glyph="◉" />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} label="Stats" glyph="◈" />
          ),
        }}
      />
    </Tabs>
  );
}
