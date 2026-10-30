import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { BurgerMenuButton } from '@/components/atoms';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { unreadCount } = useNotifications();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: () => <Text>🔔</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarButton: () => <BurgerMenuButton unreadCount={unreadCount} />,
        }}
      />
      <Tabs.Screen name="household" options={{ href: null }} />
      <Tabs.Screen name="list" options={{ href: null }} />
      <Tabs.Screen name="item" options={{ href: null }} />
    </Tabs>
  );
}
