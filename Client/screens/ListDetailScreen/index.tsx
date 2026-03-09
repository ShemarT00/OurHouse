import React from 'react';
import { View, Text } from 'react-native';
import { ItemList } from '../../components/organisms';
import { Button } from '../../components/atoms';
import { useListItems, useToggleItem, useDeleteItem } from './hooks';

interface ListDetailScreenProps {
  listId: number;
  listName: string;
}

const ListDetailScreen: React.FC<ListDetailScreenProps> = ({ listId, listName }) => {
  const { data: items = [], isLoading } = useListItems(listId);
  const { mutate: toggleItem } = useToggleItem(listId);
  const { mutate: deleteItem } = useDeleteItem(listId);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-8 pb-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">{listName}</Text>
        <Button
          label="+ Add Item"
          onPress={() => {/* TODO: navigate to AddItemScreen */}}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : (
        <ItemList
          items={items}
          onToggle={(item) => toggleItem({ itemId: item.OHID, isCompleted: !item.isCompleted })}
          onDelete={(item) => deleteItem(item.OHID)}
        />
      )}
    </View>
  );
};

export default ListDetailScreen;
