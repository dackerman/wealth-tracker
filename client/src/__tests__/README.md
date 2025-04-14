# WealthVision Testing Guide

This document outlines our testing approach and provides guidelines for writing resilient tests that won't break with UI changes.

## Test Organization

Tests are organized into the following categories:

1. **Unit Tests**: Test individual functions in isolation
   - Located in the root of `__tests__` directory (e.g., `basic.test.ts`)
   - Focus on pure functions with well-defined inputs and outputs

2. **Component Tests**: Test React components with mocked dependencies
   - Located in `__tests__/components` directory
   - Use react-testing-library patterns

3. **Hook Tests**: Test custom React hooks
   - Located in `__tests__/hooks` directory
   - Use renderHook from react-testing-library

## Best Practices for UI-Resilient Tests

To ensure tests don't break when UI changes:

1. **Use data-testid attributes** instead of relying on class names, element types, or DOM structure
   - Good: `screen.getByTestId('net-worth-value')`
   - Avoid: `screen.getByText('Net Worth').closest('div').querySelector('.amount')`

2. **Test behavior, not implementation**
   - Focus on what the component does, not how it's built
   - Test that data is displayed correctly, not the exact HTML structure

3. **Use mock components** that mirror the behavior but simplify the implementation
   - Create simplified versions of complex components for testing
   - Focus on the core data and functionality

4. **Avoid snapshot tests** for UI components that change frequently
   - Snapshots break easily with minor UI updates
   - Use explicit assertions instead

## Running Tests

Use our test runner script to execute tests:

```bash
# Run all tests
./run-tests.sh

# Run only basic tests
./run-tests.sh -b

# Run only component tests
./run-tests.sh -c

# Run with verbose output
./run-tests.sh -v

# Run a specific test file
./run-tests.sh path/to/test.ts
```

## Testing Data

- Use realistic but simplified test data
- Avoid hardcoding large datasets in test files
- For component tests, use mock data that resembles the shape of real data

## Mocking Dependencies

- Use mock functions (`jest.fn()`) for external dependencies
- For API calls, use MSW (Mock Service Worker) to intercept and mock responses
- When testing hooks that use context, provide a test wrapper that includes all required providers