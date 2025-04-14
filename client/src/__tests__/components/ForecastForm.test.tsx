import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForecastFormValues, defaultValues, calculateForecastData } from '../../components/forecast-calculator';

// Create a mock forecast form component for testing
const MockForecastForm = () => {
  const [values, setValues] = React.useState<ForecastFormValues>(defaultValues);
  const [results, setResults] = React.useState<any>(null);
  
  const handleChange = (field: keyof ForecastFormValues, value: number) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedData = calculateForecastData(values);
    setResults(calculatedData);
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} data-testid="forecast-form">
        <div>
          <label htmlFor="currentAge">Current Age</label>
          <input
            id="currentAge"
            type="number"
            data-testid="current-age-input"
            value={values.currentAge}
            onChange={(e) => handleChange('currentAge', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="retirementAge">Retirement Age</label>
          <input
            id="retirementAge"
            type="number"
            data-testid="retirement-age-input"
            value={values.retirementAge}
            onChange={(e) => handleChange('retirementAge', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="currentSavings">Current Savings ($)</label>
          <input
            id="currentSavings"
            type="number"
            data-testid="current-savings-input"
            value={values.currentSavings}
            onChange={(e) => handleChange('currentSavings', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="monthlyExpenses">Monthly Expenses ($)</label>
          <input
            id="monthlyExpenses"
            type="number"
            data-testid="monthly-expenses-input"
            value={values.monthlyExpenses}
            onChange={(e) => handleChange('monthlyExpenses', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="monthlyContributions">Monthly Contributions ($)</label>
          <input
            id="monthlyContributions"
            type="number"
            data-testid="monthly-contributions-input"
            value={values.monthlyContributions}
            onChange={(e) => handleChange('monthlyContributions', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="annualInvestmentReturn">Annual Investment Return (%)</label>
          <input
            id="annualInvestmentReturn"
            type="number"
            data-testid="investment-return-input"
            value={values.annualInvestmentReturn}
            onChange={(e) => handleChange('annualInvestmentReturn', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="annualInflationRate">Annual Inflation Rate (%)</label>
          <input
            id="annualInflationRate"
            type="number"
            data-testid="inflation-rate-input"
            value={values.annualInflationRate}
            onChange={(e) => handleChange('annualInflationRate', Number(e.target.value))}
          />
        </div>
        
        <div>
          <label htmlFor="safeWithdrawalRate">Safe Withdrawal Rate (%)</label>
          <input
            id="safeWithdrawalRate"
            type="number"
            data-testid="withdrawal-rate-input"
            value={values.safeWithdrawalRate}
            onChange={(e) => handleChange('safeWithdrawalRate', Number(e.target.value))}
          />
        </div>
        
        <button type="submit" data-testid="calculate-button">Calculate Retirement</button>
      </form>
      
      {results && (
        <div data-testid="results">
          <h2>Results</h2>
          <div data-testid="retirement-target">
            Target: ${Math.round(results.retirementTarget).toLocaleString()}
          </div>
          <div data-testid="savings-at-retirement">
            Projected Savings: ${Math.round(results.savingsAtRetirement).toLocaleString()}
          </div>
          {results.canRetireAge && (
            <div data-testid="can-retire-age">
              Financial Independence: Age {results.canRetireAge}
            </div>
          )}
        </div>
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
      {children}
    </QueryClientProvider>
  );
};

describe('Forecast Form', () => {
  it('renders with default values', () => {
    render(<MockForecastForm />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId('forecast-form')).toBeInTheDocument();
    expect(screen.getByTestId('current-age-input')).toHaveValue(defaultValues.currentAge);
    expect(screen.getByTestId('retirement-age-input')).toHaveValue(defaultValues.retirementAge);
    expect(screen.getByTestId('monthly-expenses-input')).toHaveValue(defaultValues.monthlyExpenses);
  });
  
  it('updates values when inputs change', async () => {
    render(<MockForecastForm />, { wrapper: createWrapper() });
    
    const currentSavingsInput = screen.getByTestId('current-savings-input');
    const monthlyContributionsInput = screen.getByTestId('monthly-contributions-input');
    
    // Set new values
    await userEvent.clear(currentSavingsInput);
    await userEvent.type(currentSavingsInput, '100000');
    
    await userEvent.clear(monthlyContributionsInput);
    await userEvent.type(monthlyContributionsInput, '2000');
    
    expect(currentSavingsInput).toHaveValue(100000);
    expect(monthlyContributionsInput).toHaveValue(2000);
  });
  
  it('calculates and displays retirement projections', async () => {
    render(<MockForecastForm />, { wrapper: createWrapper() });
    
    // Set sample values
    const currentSavingsInput = screen.getByTestId('current-savings-input');
    await userEvent.clear(currentSavingsInput);
    await userEvent.type(currentSavingsInput, '100000');
    
    // Submit the form
    const calculateButton = screen.getByTestId('calculate-button');
    fireEvent.click(calculateButton);
    
    // Results should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('retirement-target')).toBeInTheDocument();
    expect(screen.getByTestId('savings-at-retirement')).toBeInTheDocument();
  });
  
  it('shows financial independence when savings exceed target', async () => {
    render(<MockForecastForm />, { wrapper: createWrapper() });
    
    // Set values that would result in financial independence
    const currentSavingsInput = screen.getByTestId('current-savings-input');
    await userEvent.clear(currentSavingsInput);
    await userEvent.type(currentSavingsInput, '1000000');
    
    const monthlyContributionsInput = screen.getByTestId('monthly-contributions-input');
    await userEvent.clear(monthlyContributionsInput);
    await userEvent.type(monthlyContributionsInput, '5000');
    
    // Submit the form
    const calculateButton = screen.getByTestId('calculate-button');
    fireEvent.click(calculateButton);
    
    // Results should include financial independence age
    await waitFor(() => {
      expect(screen.getByTestId('can-retire-age')).toBeInTheDocument();
    });
  });
});