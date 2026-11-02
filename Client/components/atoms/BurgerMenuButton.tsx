import { useState } from 'react';
import { View, Text, Pressable, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { NEW_HOUSEHOLD, pickRoute, FROM_OUTSIDE_HOUSEHOLD } from '@/navigation/routes';

// A new list or item first needs a household (and list) to go in, chosen on household/pick
const MENU_ITEMS: { label: string; icon: string; href: Href }[] = [
  { label: 'Household', icon: '🏡', href: NEW_HOUSEHOLD },
  { label: 'List', icon: '📋', href: pickRoute('list') },
  { label: 'Item', icon: '🛒', href: pickRoute('item') },
];

interface BurgerMenuButtonProps {
  unreadCount?: number;
}

export function BurgerMenuButton({ unreadCount = 0 }: BurgerMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNavigate = (href: Href) => {
    setOpen(false);
    router.push(href, FROM_OUTSIDE_HOUSEHOLD);
  };

  return (
    <>
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => setOpen(true)}
        accessibilityLabel={unreadCount > 0 ? `Open menu, ${unreadCount} unread notifications` : 'Open menu'}
        accessibilityRole="button"
      >
        <View>
          <Text className="text-2xl">☰</Text>
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-500 mt-1">Menu</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="absolute bottom-20 right-4 bg-white rounded-xl overflow-hidden shadow-md">
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                className={`flex-row items-center px-5 py-4${
                  index < MENU_ITEMS.length - 1 ? ' border-b border-gray-100' : ''
                }`}
                onPress={() => handleNavigate(item.href)}
              >
                <Text className="text-lg mr-3">{item.icon}</Text>
                <Text className="text-base font-medium text-gray-800">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
