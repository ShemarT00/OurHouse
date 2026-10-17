import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { useAuth } from '@/hooks/useAuth';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLoginAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

const fillAndSubmit = (utils: ReturnType<typeof render>, password: string) => {
  fireEvent.changeText(utils.getByPlaceholderText('Email'), 'jane@example.com');
  fireEvent.changeText(utils.getByPlaceholderText('Password'), password);
  fireEvent.press(utils.getByText('Sign In'));
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      loginAsync: mockLoginAsync,
      loginMutation: { ...defaultMutation },
    });
  });

  it('lands in the app after logging in with valid credentials', async () => {
    mockLoginAsync.mockResolvedValueOnce({ id: 'user-1' });
    const utils = render(<LoginScreen />);

    fillAndSubmit(utils, 'password123');

    await waitFor(() => {
      expect(mockLoginAsync).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'password123' });
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('stays on the login screen when the credentials are wrong', async () => {
    mockLoginAsync.mockRejectedValueOnce(new Error('Incorrect email or password.'));
    const utils = render(<LoginScreen />);

    fillAndSubmit(utils, 'wrong-password');

    await waitFor(() => expect(mockLoginAsync).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the login error message', () => {
    mockUseAuth.mockReturnValue({
      loginAsync: mockLoginAsync,
      loginMutation: { ...defaultMutation, isError: true, error: new Error('Incorrect email or password.') },
    });

    const { getByText } = render(<LoginScreen />);
    expect(getByText('Incorrect email or password.')).toBeTruthy();
  });
});
