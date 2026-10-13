import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '@/app/(auth)/register';
import { useAuth } from '@/hooks/useAuth';

const mockReplace = jest.fn();
const mockSignupAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

describe('RegisterScreen — Register button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signupAsync: mockSignupAsync,
      signupMutation: { ...defaultMutation },
    });
  });

  it('renders the Register button', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Register')).toBeTruthy();
  });

  it('calls signupAsync with the entered form data when Register is pressed', async () => {
    mockSignupAsync.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Jane');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(mockSignupAsync).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      });
    });
  });

  it('navigates to (app) after successful registration', async () => {
    mockSignupAsync.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Jane');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('does not call signupAsync when required fields are empty', async () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(mockSignupAsync).not.toHaveBeenCalled();
    });
  });

  it('disables the button and shows a spinner while submission is pending', () => {
    mockUseAuth.mockReturnValue({
      signupAsync: mockSignupAsync,
      signupMutation: { ...defaultMutation, isPending: true },
    });

    const { queryByText } = render(<RegisterScreen />);
    // "Register" text is replaced by ActivityIndicator when pending
    expect(queryByText('Register')).toBeNull();
  });

  it('shows the server error message when registration fails', () => {
    mockUseAuth.mockReturnValue({
      signupAsync: mockSignupAsync,
      signupMutation: {
        ...defaultMutation,
        isError: true,
        error: { message: 'Email already in use' },
      },
    });

    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Email already in use')).toBeTruthy();
  });

  it('shows a fallback error message when the error has no message', () => {
    mockUseAuth.mockReturnValue({
      signupAsync: mockSignupAsync,
      signupMutation: { ...defaultMutation, isError: true, error: null },
    });

    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Registration failed')).toBeTruthy();
  });
});
