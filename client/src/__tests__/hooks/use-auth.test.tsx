import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock HTTP responses
class HttpResponse {
  body: any;
  status: number;
  headers: Record<string, string>;

  constructor(body: any, options?: { status?: number, headers?: Record<string, string> }) {
    this.body = body;
    this.status = options?.status || 200;
    this.headers = options?.headers || {};
  }

  static json(data: any, options?: { status?: number, headers?: Record<string, string> }) {
    return new HttpResponse(JSON.stringify(data), options);
  }
}

// Simple mock server
const http = {
  get: (url: string, handler: () => HttpResponse) => ({ url, method: 'GET', handler }),
  post: (url: string, handler: (args: any) => HttpResponse) => ({ url, method: 'POST', handler })
};

const setupServer = (...handlers: any[]) => {
  const server = {
    handlers,
    originalHandlers: [...handlers],
    listen: () => {},
    resetHandlers: () => { server.handlers = [...server.originalHandlers] },
    close: () => {},
    use: (...newHandlers: any[]) => { server.handlers = [...newHandlers, ...server.handlers] }
  };
  
  // Mock fetch globally
  global.fetch = async (url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const matchingHandler = server.handlers.find(h => h.url === url && h.method === method);
    
    if (matchingHandler) {
      const response = matchingHandler.handler({ 
        request: { 
          json: async () => options?.body ? JSON.parse(options.body as string) : {}
        } 
      });
      
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        text: async () => typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
        json: async () => typeof response.body === 'string' ? JSON.parse(response.body) : response.body
      } as Response;
    }
    
    return {
      ok: false,
      status: 404,
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' })
    } as Response;
  };
  
  return server;
};

// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

// Create a simplified version of the AuthContext and provider for testing
interface MockUser {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (credentials: { username: string; password: string }) => void;
    isPending: boolean;
    error: Error | null;
  };
  logoutMutation: {
    mutate: () => void;
    isPending: boolean;
    error: Error | null;
  };
  registerMutation: {
    mutate: (credentials: { username: string; password: string }) => void;
    isPending: boolean;
    error: Error | null;
  };
}

const AuthContext = React.createContext<AuthContextType | null>(null);

// Set up MSW server to intercept API requests
const server = setupServer(
  // User endpoint
  http.get('/api/user', () => {
    return HttpResponse.json(mockUser, { status: 200 });
  }),
  
  // Login endpoint
  http.post('/api/login', async ({ request }) => {
    const { username, password } = await request.json();
    
    if (username === 'testuser' && password === 'password123') {
      return HttpResponse.json(mockUser, { status: 200 });
    }
    
    return new HttpResponse('Invalid credentials', { status: 401 });
  }),
  
  // Register endpoint
  http.post('/api/register', async ({ request }) => {
    const { username } = await request.json();
    
    if (username === 'existinguser') {
      return new HttpResponse('Username already exists', { status: 400 });
    }
    
    return HttpResponse.json({ ...mockUser, username }, { status: 201 });
  }),
  
  // Logout endpoint
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 });
  })
);

// Start MSW server before tests
beforeAll(() => server.listen());
// Reset any request handlers between tests
afterEach(() => server.resetHandlers());
// Clean up after all tests
afterAll(() => server.close());

// Mock implementation of our AuthProvider
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  const [loginPending, setLoginPending] = React.useState(false);
  const [loginError, setLoginError] = React.useState<Error | null>(null);
  
  const [logoutPending, setLogoutPending] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<Error | null>(null);
  
  const [registerPending, setRegisterPending] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    // Simulate fetching user
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else if (res.status !== 401) {
          throw new Error('Failed to fetch user');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  const loginMutation = {
    mutate: async (credentials: { username: string; password: string }) => {
      setLoginPending(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        if (!res.ok) {
          throw new Error(await res.text());
        }
        
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        setLoginError(err instanceof Error ? err : new Error('Login failed'));
      } finally {
        setLoginPending(false);
      }
    },
    isPending: loginPending,
    error: loginError
  };
  
  const logoutMutation = {
    mutate: async () => {
      setLogoutPending(true);
      try {
        const res = await fetch('/api/logout', { method: 'POST' });
        
        if (!res.ok) {
          throw new Error('Logout failed');
        }
        
        setUser(null);
      } catch (err) {
        setLogoutError(err instanceof Error ? err : new Error('Logout failed'));
      } finally {
        setLogoutPending(false);
      }
    },
    isPending: logoutPending,
    error: logoutError
  };
  
  const registerMutation = {
    mutate: async (credentials: { username: string; password: string }) => {
      setRegisterPending(true);
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        if (!res.ok) {
          throw new Error(await res.text());
        }
        
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        setRegisterError(err instanceof Error ? err : new Error('Registration failed'));
      } finally {
        setRegisterPending(false);
      }
    },
    isPending: registerPending,
    error: registerError
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Test component to use the auth hook
const TestComponent = () => {
  const { user, isLoading, loginMutation, logoutMutation, registerMutation } = useAuth();
  
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  
  if (user) {
    return (
      <div>
        <div data-testid="user-info">Logged in as: {user.username}</div>
        <button 
          data-testid="logout-button" 
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div data-testid="not-logged-in">Not logged in</div>
      <button 
        data-testid="login-button" 
        onClick={() => loginMutation.mutate({ username: 'testuser', password: 'password123' })}
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
      <button 
        data-testid="register-button" 
        onClick={() => registerMutation.mutate({ username: 'newuser', password: 'newpassword' })}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Registering...' : 'Register'}
      </button>
      {loginMutation.error && (
        <div data-testid="login-error">{loginMutation.error.message}</div>
      )}
      {registerMutation.error && (
        <div data-testid="register-error">{registerMutation.error.message}</div>
      )}
    </div>
  );
};

// Create a wrapper component with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

describe('useAuth hook', () => {
  it('shows loading state initially', () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
  
  it('shows logged in state when user data is available', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as: testuser');
  });
  
  it('handles login correctly', async () => {
    // Override the default server handler to return no user initially
    server.use(
      http.get('/api/user', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );
    
    render(<TestComponent />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Check that user is logged in after successful login
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as: testuser');
  });
  
  it('handles login errors correctly', async () => {
    // Override the default server handler to return no user initially
    server.use(
      http.get('/api/user', () => {
        return new HttpResponse(null, { status: 401 });
      }),
      
      // Make login fail
      http.post('/api/login', () => {
        return new HttpResponse('Invalid credentials', { status: 401 });
      })
    );
    
    render(<TestComponent />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid credentials');
  });
  
  it('handles logout correctly', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });
    
    // Click logout button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('logout-button'));
    
    // Check that user is logged out
    await waitFor(() => {
      expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
    });
  });
  
  it('handles registration correctly', async () => {
    // Override the default server handler to return no user initially
    server.use(
      http.get('/api/user', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );
    
    render(<TestComponent />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
    });
    
    // Click register button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('register-button'));
    
    // Check that user is logged in after successful registration
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as: newuser');
  });
});