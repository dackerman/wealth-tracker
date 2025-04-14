import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple React component for testing
const SimpleComponent = () => {
  return (
    <div data-testid="simple-component">
      <h1>Hello, World!</h1>
    </div>
  );
};

describe('SimpleComponent', () => {
  it('renders correctly', () => {
    render(<SimpleComponent />);
    
    const element = screen.getByTestId('simple-component');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello, World!');
  });
});