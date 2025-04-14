// Extract the calculation function from Forecast.tsx for testing
import { ForecastFormValues, calculateForecastData } from '../components/forecast-calculator';

describe('Retirement Forecast Calculator', () => {
  // Default test values
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

  it('calculates retirement target correctly', () => {
    const result = calculateForecastData(testValues);
    
    // Retirement target should be annual expenses minus retirement income, adjusted for inflation, 
    // then divided by the safe withdrawal rate
    const yearsUntilRetirement = testValues.retirementAge - testValues.currentAge;
    const inflationFactor = Math.pow(1 + testValues.annualInflationRate / 100, yearsUntilRetirement);
    const annualExpensesAtRetirement = (testValues.monthlyExpenses * 12) * inflationFactor;
    const annualRetirementIncomeAtRetirement = (testValues.retirementIncome * 12) * inflationFactor;
    const annualWithdrawalNeeded = annualExpensesAtRetirement - annualRetirementIncomeAtRetirement;
    const expectedTarget = annualWithdrawalNeeded / (testValues.safeWithdrawalRate / 100);
    
    expect(result.retirementTarget).toBeCloseTo(expectedTarget, 0); // Allow some rounding differences
  });

  it('projects savings at retirement correctly', () => {
    const result = calculateForecastData(testValues);
    
    // Check that the savings at retirement is a positive number
    expect(result.savingsAtRetirement).toBeGreaterThan(0);
    
    // The exact value depends on the compound interest calculation
    // We'll test for a reasonable range based on the inputs
    const yearsUntilRetirement = testValues.retirementAge - testValues.currentAge;
    
    // Calculate a simple approximation (this won't match exactly but should be in the ballpark)
    const annualContributions = testValues.monthlyContributions * 12;
    let expectedApproxSavings = testValues.currentSavings;
    for (let i = 0; i < yearsUntilRetirement; i++) {
      expectedApproxSavings = expectedApproxSavings * (1 + testValues.annualInvestmentReturn / 100) + annualContributions;
    }
    
    // Check that the actual result is within 5% of our approximation
    const lowerBound = expectedApproxSavings * 0.95;
    const upperBound = expectedApproxSavings * 1.05;
    expect(result.savingsAtRetirement).toBeGreaterThanOrEqual(lowerBound);
    expect(result.savingsAtRetirement).toBeLessThanOrEqual(upperBound);
  });

  it('determines if retirement is possible', () => {
    // Test with values that should allow retirement
    const successCase = calculateForecastData({
      ...testValues,
      currentSavings: 200000,
      monthlyContributions: 2000,
    });
    
    expect(successCase.canRetireAge).not.toBeNull();
    expect(typeof successCase.canRetireAge).toBe('number');
    
    // Test with values that make retirement difficult
    const failureCase = calculateForecastData({
      ...testValues,
      currentSavings: 1000,
      monthlyContributions: 100,
      monthlyExpenses: 10000,
    });
    
    // Either it can't retire or the retire age is very high
    if (failureCase.canRetireAge !== null) {
      expect(failureCase.canRetireAge).toBeGreaterThan(testValues.retirementAge);
    }
  });

  it('generates chart data for all years from current age to life expectancy', () => {
    const result = calculateForecastData(testValues);
    
    // Should have one data point per year
    const expectedDataPoints = testValues.lifeExpectancy - testValues.currentAge + 1;
    expect(result.chartData.length).toBe(expectedDataPoints);
    
    // First data point should be at current age
    expect(result.chartData[0].age).toBe(testValues.currentAge);
    
    // Last data point should be at life expectancy
    expect(result.chartData[result.chartData.length - 1].age).toBe(testValues.lifeExpectancy);
    
    // Data should include retirement year
    const retirementYearData = result.chartData.find(point => point.age === testValues.retirementAge);
    expect(retirementYearData).toBeDefined();
    expect(retirementYearData?.isRetirementYear).toBe(true);
  });
});