import { apiPost } from '@/services/api';

jest.mock('@/services/config', () => ({
  apiConfig: { baseURL: 'http://api.test/api', headers: { 'Content-Type': 'application/json' } },
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) } },
}));

const respond = (status: number, body?: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    headers: { get: () => (body === undefined ? null : 'application/json') },
    json: async () => body,
  }) as jest.Mock;
};

describe('api error responses', () => {
  it("surfaces the server's message, which is written for users", async () => {
    respond(400, { error: 'Bad Request', message: 'There is already a store called "Tesco"' });

    const result = await apiPost('/households/5/stores', { name: 'tesco' });

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({ message: 'There is already a store called "Tesco"', status: 400 });
  });

  it('falls back to the status when the server sends no message', async () => {
    respond(502);

    expect((await apiPost('/households')).error?.message).toBe('HTTP 502');
  });
});
