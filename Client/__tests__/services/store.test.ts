import { createStore, getHouseholdStores } from '@/services/store';
import { apiGet, apiPost } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

jest.mock('@/services/config', () => ({
  API_ENDPOINTS: {
    STORES: {
      LIST: (householdId: string) => `/households/${householdId}/stores`,
      CREATE: (householdId: string) => `/households/${householdId}/stores`,
    },
  },
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPost = apiPost as jest.Mock;

describe('store service', () => {
  beforeEach(() => jest.clearAllMocks());

  it("gets the household's stores", async () => {
    mockApiGet.mockResolvedValueOnce({ success: true, data: [] });
    await getHouseholdStores('5');
    expect(mockApiGet).toHaveBeenCalledWith('/households/5/stores');
  });

  it('adds a store to the household', async () => {
    mockApiPost.mockResolvedValueOnce({ success: true, data: { OHID: 7 } });
    await createStore('5', { name: 'Tesco' });
    expect(mockApiPost).toHaveBeenCalledWith('/households/5/stores', { name: 'Tesco' });
  });

  it('explains a duplicate name instead of showing "HTTP 400"', async () => {
    mockApiPost.mockResolvedValueOnce({
      success: false,
      error: { message: 'HTTP 400', status: 400, code: 'HTTP_400' },
    });

    const result = await createStore('5', { name: 'tesco' });

    expect(result.error?.message).toBe('This household already has a store with that name.');
  });
});
