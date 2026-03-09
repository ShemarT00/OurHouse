import { FlatList, View, Text } from 'react-native';
import type { Member } from '../../types';

// Component to display a list of household members, used in the household details screen. Each member is shown with a simple avatar and their ID.
interface MemberListProps {
  members: Member[];
}

// Row component for each member in the list, showing a circular avatar with the member's ID and their name (or placeholder text)
function MemberRow({ member }: { member: Member }) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-gray-100">
      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-blue-600 font-semibold text-sm">#{member.OHID}</Text>
      </View>
      <Text className="text-base text-gray-900">Member {member.OHID}</Text>
    </View>
  );
}

export function MemberList({ members }: MemberListProps) {
  return (
    <FlatList
      data={members}
      keyExtractor={(m) => String(m.OHID)}
      renderItem={({ item }) => <MemberRow member={item} />}
    />
  );
}
