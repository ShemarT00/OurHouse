import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateListScreen from '@/app/(app)/list/create';
import { useLists } from '@/hooks/useLists';

const mockBack = jest.fn();
const mockCreateListAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ householdId: '5' }),
}));

jest.mock('@/hooks/useLists', () => ({
  useLists: jest.fn(),
}));

const mockUseLists = useLists as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

const submit = (utils: ReturnType<typeof render>, name: string) => {
  fireEvent.changeText(utils.getByPlaceholderText('e.g. Weekly Groceries'), name);
  fireEvent.press(utils.getByText('Create List'));
};

describe('CreateListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLists.mockReturnValue({
      createListAsync: mockCreateListAsync,
      createMutation: { ...defaultMutation },
    });
  });

  it('creates a named list in the household and returns to it', async () => {
    mockCreateListAsync.mockResolvedValueOnce({ OHID: 3, name: 'Weekly Groceries', householdId: 5 });
    const utils = render(<CreateListScreen />);

    submit(utils, '  Weekly Groceries ');

    await waitFor(() => {
      expect(mockUseLists).toHaveBeenCalledWith('5');
      expect(mockCreateListAsync).toHaveBeenCalledWith({ name: 'Weekly Groceries' });
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('requires a name', async () => {
    const utils = render(<CreateListScreen />);

    submit(utils, '   ');

    expect(await utils.findByText('List name is required')).toBeTruthy();
    expect(mockCreateListAsync).not.toHaveBeenCalled();
  });

  it('stays on the screen when creating fails', async () => {
    mockCreateListAsync.mockRejectedValueOnce(new Error('HTTP 404'));
    const utils = render(<CreateListScreen />);

    submit(utils, 'Weekly Groceries');

    await waitFor(() => expect(mockCreateListAsync).toHaveBeenCalled());
    expect(mockBack).not.toHaveBeenCalled();
  });
});
