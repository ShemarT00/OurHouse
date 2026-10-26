import { FlatList, View, Text } from 'react-native';
import type { Member } from '@/types';

// List of household members: avatar initials, full name, and Admin / You labels
interface MemberListProps {
  members: Member[];
  /** Supabase auth user ID of the viewer, to label their own row "You" */
  currentUserId?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface MemberRowProps {
  member: Member;
  isCurrentUser: boolean;
}

const initials = (member: Member): string =>
  `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase() || '?';

const fullName = (member: Member): string =>
  `${member.firstName} ${member.lastName}`.trim() || 'Unnamed member';

function MemberRow({ member, isCurrentUser }: MemberRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-gray-100">
      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-blue-600 font-semibold text-sm">{initials(member)}</Text>
      </View>
      <Text className="flex-1 text-base text-gray-900">
        {fullName(member)}
        {isCurrentUser && <Text className="text-gray-400"> (You)</Text>}
      </Text>
      {member.isAdmin && (
        <View className="rounded-full px-2 py-0.5 bg-blue-100">
          <Text className="text-xs font-medium text-blue-700">Admin</Text>
        </View>
      )}
    </View>
  );
}

export function MemberList({ members, currentUserId, refreshing, onRefresh }: MemberListProps) {
  return (
    <FlatList
      data={members}
      keyExtractor={(m) => String(m.OHID)}
      renderItem={({ item }) => <MemberRow member={item} isCurrentUser={item.userId === currentUserId} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
