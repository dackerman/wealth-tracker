import { ForecastFormValues, calculateForecastData } from '../components/forecast-calculator';

describe('Basic Forecast Calculator Tests', () => {
  // Simplified test values
  const testValues: ForecastFormValues = {
    currentAge: 35,
    retirementAge: 65,
    currentSavings: 100000,
    monthlyExpenses: 5000,
    monthlyContributions: 1000,
    annualInvestmentReturn: 7,
    annualInflationRate: 3,
    retirementIncome: 2000,
    safeWithdrawalRate: 4,
    lifeExpectancy: 90
  };

  test('calculator should return expected structure', () => {
    const result = calculateForecastData(testValues);
    
    // Check basic structure
    expect(result).toBeDefined();
    expect(result.chartData).toBeDefined();
    expect(Array.isArray(result.chartData)).toBe(true);
    expect(typeof result.retirementTarget).toBe('number');
    expect(typeof result.successRate).toBe('number');
    expect(typeof result.savingsAtRetirement).toBe('number');
  });
  
  test('chartData should have correct length and structure', () => {
    const result = calculateForecastData(testValues);
    
    // One data point for each year from current age to life expectancy
    const expectedLength = testValues.lifeExpectancy - testValues.currentAge + 1;
    expect(result.chartData.length).toBe(expectedLength);
    
    // Check first data point structure
    const firstPoint = result.chartData[0];
    expect(firstPoint.age).toBe(testValues.currentAge);
    expect(typeof firstPoint.savings).toBe('number');
    expect(typeof firstPoint.target).toBe('number');
    expect(typeof firstPoint.expenses).toBe('number');
  });
});