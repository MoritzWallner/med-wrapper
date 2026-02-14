import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HistoryProvider } from '@/contexts/history-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <HistoryProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colorScheme === 'dark' ? '#2c3035' : '#e2e6ea',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Analyze',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="document-scanner" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="history" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </HistoryProvider>
  );
}
