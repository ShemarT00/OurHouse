import { subscribeToListItems, subscribeToInbox } from '@/services/realtime';
import { supabase } from '@/services/config';

jest.mock('@/services/config', () => {
  const channel = { on: jest.fn(), subscribe: jest.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    supabase: {
      realtime: { setAuth: jest.fn().mockResolvedValue(undefined) },
      channel: jest.fn().mockReturnValue(channel),
      removeChannel: jest.fn(),
    },
  };
});

const mockSupabase = supabase as unknown as {
  realtime: { setAuth: jest.Mock };
  channel: jest.Mock;
  removeChannel: jest.Mock;
};
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('subscribeToListItems', () => {
  beforeEach(() => jest.clearAllMocks());

  it("joins the list's private channel with the user's token and reports every change", async () => {
    const onChange = jest.fn();
    subscribeToListItems('3', onChange);
    await flush();

    expect(mockSupabase.realtime.setAuth).toHaveBeenCalled();
    expect(mockSupabase.channel).toHaveBeenCalledWith('list:3', { config: { private: true } });
    const channel = mockSupabase.channel.mock.results[0].value;
    expect(channel.on).toHaveBeenCalledWith('broadcast', { event: '*' }, expect.any(Function));
    expect(channel.subscribe).toHaveBeenCalled();

    channel.on.mock.calls[0][2]({ event: 'INSERT', payload: {} });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('leaves the channel when unsubscribed', async () => {
    const unsubscribe = subscribeToListItems('3', jest.fn());
    await flush();

    unsubscribe();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockSupabase.channel.mock.results[0].value);
  });

  it('does not join at all if unsubscribed before the token is ready', async () => {
    const unsubscribe = subscribeToListItems('3', jest.fn());
    unsubscribe();
    await flush();

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});

describe('subscribeToInbox', () => {
  beforeEach(() => jest.clearAllMocks());

  it("joins the member's private inbox channel and reports each new notification", async () => {
    const onNew = jest.fn();
    subscribeToInbox('sam', onNew);
    await flush();

    expect(mockSupabase.channel).toHaveBeenCalledWith('inbox:sam', { config: { private: true } });
    const channel = mockSupabase.channel.mock.results[0].value;
    channel.on.mock.calls[0][2]({ event: 'INSERT', payload: {} });
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
