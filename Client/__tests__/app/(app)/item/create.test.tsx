import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateItemScreen from '@/app/(app)/item/create';
import { useItems } from '@/hooks/useItems';
import { Priority } from '@/types';

const mockBack = jest.fn();
const mockAddItemAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ householdId: '5', listId: '3' }),
}));

jest.mock('@/hooks/useItems', () => ({
  useItems: jest.fn(),
}));

const mockUseItems = useItems as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

const fill = (utils: ReturnType<typeof render>, fields: { name?: string; quantity?: string; notes?: string }) => {
  if (fields.name !== undefined) fireEvent.changeText(utils.getByPlaceholderText('e.g. Milk'), fields.name);
  if (fields.quantity !== undefined) fireEvent.changeText(utils.getByPlaceholderText('e.g. 2'), fields.quantity);
  if (fields.notes !== undefined) fireEvent.changeText(utils.getByPlaceholderText('Any extra details...'), fields.notes);
};

describe('CreateItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseItems.mockReturnValue({ addItemAsync: mockAddItemAsync, createMutation: { ...defaultMutation } });
  });

  it('saves the name, quantity, urgency and notes', async () => {
    mockAddItemAsync.mockResolvedValueOnce({ OHID: 9 });
    const utils = render(<CreateItemScreen />);

    fill(utils, { name: ' Milk ', quantity: '2', notes: ' semi-skimmed ' });
    fireEvent.press(utils.getByText('High'));
    fireEvent.press(utils.getAllByText('Add Item')[1]);

    await waitFor(() => {
      expect(mockUseItems).toHaveBeenCalledWith('5', '3');
      expect(mockAddItemAsync).toHaveBeenCalledWith({
        name: 'Milk',
        priority: Priority.HIGH,
        quantity: 2,
        notes: 'semi-skimmed',
      });
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('sends no quantity or notes when they are left blank', async () => {
    mockAddItemAsync.mockResolvedValueOnce({ OHID: 9 });
    const utils = render(<CreateItemScreen />);

    fill(utils, { name: 'Bread' });
    fireEvent.press(utils.getAllByText('Add Item')[1]);

    await waitFor(() =>
      expect(mockAddItemAsync).toHaveBeenCalledWith({ name: 'Bread', priority: Priority.NONE, quantity: null, notes: null })
    );
  });

  it.each([
    [{ name: '  ' }, 'Item name is required'],
    [{ name: 'Milk', quantity: '0' }, 'Quantity must be a whole number from 1 to 9999'],
    [{ name: 'Milk', quantity: '1.5' }, 'Quantity must be a whole number from 1 to 9999'],
  ])('rejects %j', async (fields, message) => {
    const utils = render(<CreateItemScreen />);

    fill(utils, fields);
    fireEvent.press(utils.getAllByText('Add Item')[1]);

    expect(await utils.findByText(message)).toBeTruthy();
    expect(mockAddItemAsync).not.toHaveBeenCalled();
  });

  it('stays on the screen when saving fails', async () => {
    mockAddItemAsync.mockRejectedValueOnce(new Error('HTTP 500'));
    const utils = render(<CreateItemScreen />);

    fill(utils, { name: 'Milk' });
    fireEvent.press(utils.getAllByText('Add Item')[1]);

    await waitFor(() => expect(mockAddItemAsync).toHaveBeenCalled());
    expect(mockBack).not.toHaveBeenCalled();
  });
});
