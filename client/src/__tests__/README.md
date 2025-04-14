# WealthVision Testing Documentation

## Testing Structure

The WealthVision application uses Jest for unit and integration testing. This directory contains test files for various parts of the application.

### Test Categories

1. **Utility Tests** - Tests for helper functions like formatters and calculators
   - `basic.test.ts` - Tests for common utility functions like date and currency formatting
   - `forecast-calculator.test.ts` - Tests for the retirement forecast calculation logic

2. **Component Tests** - Tests for React components
   - Located in the `components/` directory
   - Tests component rendering and behavior

3. **Hook Tests** - Tests for custom React hooks
   - Located in the `hooks/` directory
   - Tests hook behavior and state management

## Running Tests

Use the main test runner script at the project root:

```bash
# Run all tests
./run-tests.sh

# Run with verbose output
./run-tests.sh -v

# Run only utility tests
./run-tests.sh -u

# Run only forecast calculator tests
./run-tests.sh -f

# Run tests with coverage report
./run-tests.sh -c

# See all options
./run-tests.sh -h
```

## Test Best Practices

1. **Keep tests isolated** - Each test should be independent and not rely on the state of other tests
2. **Use descriptive test names** - Clear test names help with debugging
3. **Test edge cases** - Include tests for boundary conditions and error handling
4. **Aim for good coverage** - Try to test all critical paths in the code
5. **Mock external dependencies** - Use Jest mocks for API calls and other external dependencies

## Test Configuration

The Jest configuration is in `jest.config.ts` at the project root. It's set up to work with:

- TypeScript
- React
- ES modules
- CSS modules
- Static assets (images, etc.)

The global test setup is in `jest.setup.ts` at the project root, which configures:

- DOM testing utilities
- Mocks for browser APIs not available in the test environment