import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../hooks/use-auth';

// Create a simple wrapper for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

describe('Auth Provider initialization', () => {
  test('AuthProvider should render without crashing', () => {
    // This test just verifies that the AuthProvider can be initialized
    expect(() => {
      renderHook(() => ({}), { wrapper });
    }).not.toThrow();
  });
});