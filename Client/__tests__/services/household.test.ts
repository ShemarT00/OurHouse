import { joinHousehold } from '@/services/household';
import { apiPost } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

jest.mock('@/services/config', () => ({
  API_ENDPOINTS: { HOUSEHOLDS: { JOIN: '/households/join' } },
}));

const mockApiPost = apiPost as jest.Mock;

describe('joinHousehold', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the code trimmed and upper-cased', async () => {
    mockApiPost.mockResolvedValueOnce({ success: true, data: { OHID: 9 } });

    await joinHousehold({ code: '  abcd2345 ' });

    expect(mockApiPost).toHaveBeenCalledWith('/households/join', { code: 'ABCD2345' });
  });

  it('explains an unknown code instead of showing "HTTP 404"', async () => {
    mockApiPost.mockResolvedValueOnce({
      success: false,
      error: { message: 'HTTP 404', status: 404, code: 'HTTP_404' },
    });

    const result = await joinHousehold({ code: 'ZZZZZZZZ' });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('No household has that invite code. Check it and try again.');
  });
});
