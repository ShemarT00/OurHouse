import { createStore, getHouseholdStores, getRetailers, updateStore } from '@/services/store';
import { apiGet, apiPatch, apiPost } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock('@/services/config', () => ({
  API_ENDPOINTS: {
    STORES: {
      LIST: (householdId: string) => `/households/${householdId}/stores`,
      CREATE: (householdId: string) => `/households/${householdId}/stores`,
      UPDATE: (householdId: string, OHID: number) => `/households/${householdId}/stores/${OHID}`,
    },
    RETAILERS: { LIST: '/retailers' },
  },
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPost = apiPost as jest.Mock;
const mockApiPatch = apiPatch as jest.Mock;

describe('store service', () => {
  beforeEach(() => jest.clearAllMocks());

  it("gets the household's stores", async () => {
    mockApiGet.mockResolvedValueOnce({ success: true, data: [] });
    await getHouseholdStores('5');
    expect(mockApiGet).toHaveBeenCalledWith('/households/5/stores');
  });

  it('adds a store to the household', async () => {
    mockApiPost.mockResolvedValueOnce({ success: true, data: { OHID: 7 } });
    await createStore('5', { name: 'Tesco', retailerKey: 'tesco', website: null });
    expect(mockApiPost).toHaveBeenCalledWith('/households/5/stores', { name: 'Tesco', retailerKey: 'tesco', website: null });
  });

  it('passes on the server\'s message when a store cannot be saved', async () => {
    const error = { message: 'There is already a store called "Tesco"', status: 400, code: 'HTTP_400' };
    mockApiPost.mockResolvedValueOnce({ success: false, error });

    expect((await createStore('5', { name: 'tesco' })).error).toEqual(error);
  });

  it('edits a store', async () => {
    mockApiPatch.mockResolvedValueOnce({ success: true, data: { OHID: 7 } });
    await updateStore('5', 7, { name: 'Market', retailerKey: null, website: 'https://market.example' });
    expect(mockApiPatch).toHaveBeenCalledWith(
      '/households/5/stores/7', { name: 'Market', retailerKey: null, website: 'https://market.example' });
  });

  it('gets the retailers', async () => {
    mockApiGet.mockResolvedValueOnce({ success: true, data: [] });
    await getRetailers();
    expect(mockApiGet).toHaveBeenCalledWith('/retailers');
  });
});
