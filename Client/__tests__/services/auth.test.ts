import { loginWithEmail, logout, signupWithEmail } from '@/services/auth';
import { supabase } from '@/services/config';

jest.mock('@/services/config', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as Record<'signUp' | 'signInWithPassword' | 'signOut', jest.Mock>;

describe('signupWithEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  const signup = () =>
    signupWithEmail({ email: 'jane@example.com', password: 'password123', firstName: ' Jane ', lastName: 'Doe' });

  it('creates the Supabase user with first and last name metadata for the profile trigger', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: null }, error: null });

    await signup();

    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'password123',
      options: { data: { first_name: 'Jane', last_name: 'Doe' } },
    });
  });

  it('reports that email confirmation is needed when no session is returned', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: null }, error: null });
    expect(await signup()).toEqual({ success: true, data: { needsConfirmation: true } });
  });

  it('reports no confirmation needed when Supabase signs the user straight in', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 't' } }, error: null });
    expect(await signup()).toEqual({ success: true, data: { needsConfirmation: false } });
  });

  it('returns a friendly error when the email is already registered', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: new Error('User already registered') });
    const result = await signup();
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('An account with this email already exists.');
  });
});

describe('loginWithEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the user on success', async () => {
    const user = { id: 'u1', email: 'jane@example.com' };
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user, session: {} }, error: null });

    expect(await loginWithEmail({ email: 'jane@example.com', password: 'password123' })).toEqual({
      success: true,
      data: user,
    });
  });

  it('fails with a friendly message for bad credentials', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });

    const result = await loginWithEmail({ email: 'jane@example.com', password: 'nope' });
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Incorrect email or password.');
  });

  it('tells unconfirmed users to check their email', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Email not confirmed'),
    });

    const result = await loginWithEmail({ email: 'jane@example.com', password: 'password123' });
    expect(result.error?.message).toBe('Check your email to confirm your account, then sign in.');
  });
});

describe('logout', () => {
  it('signs out of Supabase only', async () => {
    auth.signOut.mockResolvedValueOnce({ error: null });
    expect(await logout()).toEqual({ success: true });
  });
});
