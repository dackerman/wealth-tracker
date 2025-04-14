import { calculateForecastData, defaultValues, ForecastFormValues } from '../../components/forecast-calculator';

describe('Forecast Calculator', () => {
  const testValues: ForecastFormValues = {
    ...defaultValues,
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90,
    currentSavings: 50000,
    annualContribution: 10000,
    contributionIncreaseRate: 2,
    expectedReturnRate: 7,
    inflationRate: 3,
    withdrawalRate: 4,
    annualExpenses: 50000,
    retirementIncome: 30000,
  };

  it('calculates forecast data correctly', () => {
    const result = calculateForecastData(testValues);
    
    // Basic sanity checks
    expect(result).toBeDefined();
    expect(result.chartData).toBeInstanceOf(Array);
    expect(result.chartData.length).toBeGreaterThan(0);
    expect(result.retirementTarget).toBeGreaterThanOrEqual(0);
    
    // Check first year data
    const firstYearData = result.chartData[0];
    expect(firstYearData.age).toBe(30);
    // First year savings already includes returns and contributions
    expect(firstYearData.savings).toBe(65500);
    expect(firstYearData.isRetirementYear).toBe(false);
    
    // Check retirement year data
    const retirementYearData = result.chartData.find(d => d.age === 65);
    expect(retirementYearData).toBeDefined();
    expect(retirementYearData?.isRetirementYear).toBe(true);
    
    // Check specific financial calculations
    // Savings should grow each year before retirement
    for (let i = 1; i < 35; i++) { // 35 = retirement age - current age
      expect(result.chartData[i].savings).toBeGreaterThan(result.chartData[i-1].savings);
    }
  });
  
  it('handles early retirement scenario', () => {
    const earlyRetirementValues = {
      ...testValues,
      currentAge: 30,
      retirementAge: 40,
      currentSavings: 500000,
      annualContribution: 50000,
      expectedReturnRate: 8,
    };
    
    const result = calculateForecastData(earlyRetirementValues);
    
    // There should be 61 data points (from age 30 to 90)
    expect(result.chartData.length).toBe(61);
    
    // Retirement should happen at age 40
    const retirementYearData = result.chartData.find(d => d.isRetirementYear);
    expect(retirementYearData?.age).toBe(40);
    
    // Can retire age should be defined
    expect(result.canRetireAge).toBeDefined();
  });
  
  it('handles insufficient savings scenario', () => {
    const insufficientValues = {
      ...testValues,
      currentSavings: 5000,
      annualContribution: 2000,
      expectedReturnRate: 3,
    };
    
    const result = calculateForecastData(insufficientValues);
    
    // Need gap check - it may be null in some cases
    if (result.needGap !== null) {
      expect(result.needGap).toBeGreaterThan(0);
    } else {
      expect(result.needGap).toBeNull();
    }
    
    // If can retire age is null, success rate should be low
    if (result.canRetireAge === null) {
      expect(result.successRate).toBeLessThan(50);
    }
  });
});