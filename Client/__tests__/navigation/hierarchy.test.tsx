/// <reference types="expo-router/types/expect" />
/**
 * Household → Shopping List → Item is one navigation stack: Back always lands
 * on the parent, however the Member got there (#49, #50, #52, #53, #54).
 * Renders the real app/ routes; only the data hooks are mocked.
 */
import { renderRouter, screen, fireEvent, waitFor } from 'expo-router/testing-library';
import { ItemEvent, Priority } from '@/types';

const mockHousehold = { OHID: 5, name: 'The Smiths', inviteCode: 'ABCD2345' };
const flat = { OHID: 6, name: 'Flat 4B', inviteCode: 'WXYZ6789' };
// The Member's Households; most tests have only one
let mockHouseholds = [mockHousehold];
const mockLists = [
  { OHID: 3, name: 'Weekly shop', householdId: 5 },
  { OHID: 4, name: 'Party', householdId: 5 },
];
const mockMilk = {
  OHID: 7, name: 'Milk', listId: 3, priority: Priority.NONE, storeId: null,
  quantity: null, notes: null, bought: false,
};
const mockListNotification = {
  OHID: 1, userId: 'sam', householdId: 5, event: ItemEvent.ADDED, itemName: 'Milk',
  sentence: 'Alex added Milk', listId: 3, itemId: 7, actorId: 'alex', changes: [],
  read: true, createdAt: '2026-11-01T10:00:00Z',
};

// The root layout's Tailwind stylesheet; Jest cannot parse CSS
jest.mock('../../global.css', () => ({}));

const mockMutation = { isPending: false, isError: false, error: null, reset: jest.fn() };
const mockQuery = { isLoading: false, error: null, refetch: jest.fn(), isRefetching: false };

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true, isLoading: false, supabaseUser: { id: 'sam' },
    logout: jest.fn(), logoutMutation: { isPending: false },
  }),
}));
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    ...mockQuery, notifications: [mockListNotification], unreadCount: 0,
    markRead: jest.fn(), markAllRead: jest.fn(), isMarkingAllRead: false,
  }),
  useLiveNotifications: jest.fn(),
}));
jest.mock('@/hooks/useHouseholds', () => ({
  useHouseholds: () => ({
    ...mockQuery, households: mockHouseholds, createMutation: mockMutation, joinMutation: mockMutation,
    createHouseholdAsync: jest.fn().mockResolvedValue(mockHousehold),
  }),
  useHousehold: (householdId: string) => ({
    household: mockHouseholds.find((h) => String(h.OHID) === householdId), isLoading: false,
  }),
}));
jest.mock('@/hooks/useLists', () => ({
  useLists: () => ({ ...mockQuery, lists: mockLists, createListAsync: jest.fn().mockResolvedValue(mockLists[0]), createMutation: mockMutation }),
  useList: (_householdId: string, listId: string) => ({
    list: mockLists.find((l) => String(l.OHID) === listId), isLoading: false,
  }),
}));
jest.mock('@/hooks/useItems', () => ({
  useItems: () => ({
    ...mockQuery, items: [mockMilk], toggleItem: jest.fn(),
    addItemAsync: jest.fn().mockResolvedValue(mockMilk), createMutation: mockMutation,
    updateItemAsync: jest.fn(), removeItemAsync: jest.fn(),
    updateMutation: mockMutation, deleteMutation: mockMutation, isRemoving: false,
  }),
  useLiveItems: jest.fn(),
}));
jest.mock('@/hooks/useStores', () => ({ useStores: () => ({ ...mockQuery, stores: [] }) }));
jest.mock('@/hooks/useRetailers', () => ({ useRetailers: () => ({ retailers: [] }) }));
jest.mock('@/hooks/useHouseholdMembers', () => ({ useHouseholdMembers: () => ({ ...mockQuery, members: [] }) }));
jest.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: undefined, isLoading: false, updateProfileAsync: jest.fn(), updateMutation: mockMutation }),
}));

// Every screen in the stack stays mounted; the focused one renders last
const pressBack = () => {
  const backs = screen.getAllByText('← Back');
  fireEvent.press(backs[backs.length - 1]);
};

const start = (initialUrl: string) => renderRouter('./app', { initialUrl });

beforeEach(() => {
  mockHouseholds = [mockHousehold];
});

describe('Household → Shopping List → Item navigation', () => {
  it('Back walks up the hierarchy to Home', () => {
    start('/household/5/list/3/item/7');

    pressBack();
    expect(screen).toHavePathname('/household/5/list/3');
    pressBack();
    expect(screen).toHavePathname('/household/5');
    pressBack();
    expect(screen).toHavePathname('/');
  });

  it('#53: Back on any Shopping List lands on its Household, even after opening others', () => {
    start('/household/5');

    fireEvent.press(screen.getByText('Weekly shop'));
    expect(screen).toHavePathname('/household/5/list/3');
    pressBack();
    fireEvent.press(screen.getByText('Party'));
    expect(screen).toHavePathname('/household/5/list/4');
    pressBack();

    expect(screen).toHavePathname('/household/5');
  });

  it('#52: Back from Edit Item lands on its Shopping List, even after Add Item was used', () => {
    start('/household/5/list/3');

    fireEvent.press(screen.getByText('+ Add Item'));
    expect(screen).toHavePathname('/household/5/list/3/item/create');
    pressBack();
    fireEvent.press(screen.getByText('Milk'));
    expect(screen).toHavePathname('/household/5/list/3/item/7');
    pressBack();

    expect(screen).toHavePathname('/household/5/list/3');
  });

  it('#49: after adding an Item, the Member lands on its Shopping List', async () => {
    start('/household/5/list/3');

    fireEvent.press(screen.getByText('+ Add Item'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Milk'), 'Bread');
    fireEvent.press(screen.getAllByText('Add Item').at(-1)!);

    await waitFor(() => expect(screen).toHavePathname('/household/5/list/3'));
  });

  it('#50: after creating a Shopping List, the Member lands on its Household', async () => {
    start('/household/5');

    fireEvent.press(screen.getByText('+ New List'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Weekly Groceries'), 'Party');
    fireEvent.press(screen.getByText('Create List'));

    await waitFor(() => expect(screen).toHavePathname('/household/5'));
  });

  it('a Shopping List opened from a Notification has its Household beneath it', () => {
    start('/notifications');

    fireEvent.press(screen.getByText('Alex added Milk'));
    expect(screen).toHavePathname('/household/5/list/3');
    pressBack();
    expect(screen).toHavePathname('/household/5');
    pressBack();
    expect(screen).toHavePathname('/');
  });

  it('Back from a Household goes Home, even after New Household was opened and left', () => {
    start('/');

    fireEvent.press(screen.getByText('+ New'));
    expect(screen).toHavePathname('/household/create');
    pressBack();
    fireEvent.press(screen.getByText('The Smiths'));
    expect(screen).toHavePathname('/household/5');
    pressBack();

    expect(screen).toHavePathname('/');
  });

  it('a new Household opens in place of New Household, so Back goes Home', async () => {
    start('/');

    fireEvent.press(screen.getByText('+ New'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. The Smith Family'), 'The Smiths');
    fireEvent.press(screen.getByText('Create Household'));
    await waitFor(() => expect(screen).toHavePathname('/household/5'));
    pressBack();

    expect(screen).toHavePathname('/');
  });

  it('a Notification opened while another Shopping List is open walks back from its own list', () => {
    start('/household/5/list/4');

    fireEvent.press(screen.getAllByText('Notifications')[0]);
    fireEvent.press(screen.getByText('Alex added Milk'));
    expect(screen).toHavePathname('/household/5/list/3');
    pressBack();
    expect(screen).toHavePathname('/household/5');
    pressBack();
    expect(screen).toHavePathname('/');
  });

  it('Menu → List: saving returns to the Household, and Back goes on to Home', async () => {
    start('/');

    fireEvent.press(screen.getByLabelText('Open menu'));
    fireEvent.press(screen.getByText('List'));
    // The Member's only Household is chosen for them
    await waitFor(() => expect(screen).toHavePathname('/household/5/list/create'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Weekly Groceries'), 'Party');
    fireEvent.press(screen.getByText('Create List'));
    await waitFor(() => expect(screen).toHavePathname('/household/5'));
    pressBack();

    expect(screen).toHavePathname('/');
  });

  it('Menu → Item: saving returns to the Shopping List, and Back goes on up the hierarchy', async () => {
    start('/');

    fireEvent.press(screen.getByLabelText('Open menu'));
    fireEvent.press(screen.getByText('Item'));
    fireEvent.press(await screen.findByText('Party'));
    expect(screen).toHavePathname('/household/5/list/4/item/create');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Milk'), 'Balloons');
    fireEvent.press(screen.getAllByText('Add Item').at(-1)!);
    await waitFor(() => expect(screen).toHavePathname('/household/5/list/4'));

    pressBack();
    expect(screen).toHavePathname('/household/5');
    pressBack();
    expect(screen).toHavePathname('/');
  });

  it('Menu → Item from inside a Shopping List leaves no picker or earlier screens beneath', async () => {
    start('/household/5/list/3/item/7');

    fireEvent.press(screen.getByLabelText('Open menu'));
    fireEvent.press(screen.getByText('Item'));
    fireEvent.press(await screen.findByText('Party'));
    expect(screen).toHavePathname('/household/5/list/4/item/create');

    pressBack();
    expect(screen).toHavePathname('/household/5/list/4');
    pressBack();
    expect(screen).toHavePathname('/household/5');
    pressBack();
    expect(screen).toHavePathname('/');
  });

  it('Back from a Household goes Home, not to a Household opened earlier', () => {
    mockHouseholds = [mockHousehold, flat];
    start('/');

    fireEvent.press(screen.getByText('The Smiths'));
    pressBack();
    fireEvent.press(screen.getByText('Flat 4B'));
    expect(screen).toHavePathname('/household/6');
    pressBack();

    expect(screen).toHavePathname('/');
  });
});

describe('Tab bar', () => {
  it('the Settings tab opens Settings, and there is no Profile tab', () => {
    start('/');
    // Tab buttons are labelled "<title>, tab, n of m"
    expect(screen.queryByLabelText(/^Profile, tab/)).toBeNull();

    fireEvent.press(screen.getByLabelText(/^Settings, tab/));

    expect(screen).toHavePathname('/settings');
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });
});
