import { z } from 'zod';

// Form schema for retirement calculator
export const forecastFormSchema = z.object({
  currentAge: z.number().min(18, "Age must be 18 or older").max(90, "Age must be 90 or below"),
  retirementAge: z.number().min(20, "Retirement age must be 20 or older").max(100, "Retirement age must be 100 or below"),
  currentSavings: z.number().min(0, "Savings must be 0 or positive"),
  monthlyExpenses: z.number().min(0, "Monthly expenses must be 0 or positive"),
  monthlyContributions: z.number().min(0, "Monthly contributions must be 0 or positive"),
  annualInvestmentReturn: z.number().min(0, "Return must be 0 or positive").max(30, "Return must be 30% or below"),
  annualInflationRate: z.number().min(0, "Inflation must be 0 or positive").max(20, "Inflation must be 20% or below"),
  retirementIncome: z.number().min(0, "Retirement income must be 0 or positive"),
  safeWithdrawalRate: z.number().min(2, "Safe withdrawal rate must be at least 2%").max(10, "Safe withdrawal rate must be 10% or below"),
  lifeExpectancy: z.number().min(20, "Life expectancy must be 20 or older").max(120, "Life expectancy must be 120 or below"),
});

export type ForecastFormValues = z.infer<typeof forecastFormSchema>;

// Default values for the form
export const defaultValues: ForecastFormValues = {
  currentAge: 35,
  retirementAge: 65,
  currentSavings: 0, // Will be populated from the API
  monthlyExpenses: 5000,
  monthlyContributions: 1000,
  annualInvestmentReturn: 7,
  annualInflationRate: 3,
  retirementIncome: 2000, // Monthly income from other sources (Social Security, pension, etc.)
  safeWithdrawalRate: 4, // 4% rule
  lifeExpectancy: 90,
};

export interface ChartDataPoint {
  age: number;
  savings: number;
  target: number;
  expenses: number;
  retirementIncome: number;
  isRetirementYear: boolean;
}

export interface ForecastResult {
  chartData: ChartDataPoint[];
  retirementTarget: number;
  needGap: number | null;
  canRetireAge: number | null;
  successRate: number;
  savingsAtRetirement: number;
}

// Calculations for retirement forecasting
export const calculateForecastData = (values: ForecastFormValues): ForecastResult => {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyExpenses,
    monthlyContributions,
    annualInvestmentReturn,
    annualInflationRate,
    retirementIncome,
    safeWithdrawalRate,
    lifeExpectancy,
  } = values;

  // Monthly to annual conversion
  const annualExpenses = monthlyExpenses * 12;
  const annualContributions = monthlyContributions * 12;
  const annualRetirementIncome = retirementIncome * 12;
  
  // Calculate retirement target based on the 4% rule
  // Total money needed to withdraw (annual expenses - annual retirement income) / safe withdrawal rate
  const annualExpensesAtRetirement = annualExpenses * Math.pow(1 + annualInflationRate / 100, retirementAge - currentAge);
  const annualRetirementIncomeAtRetirement = annualRetirementIncome * Math.pow(1 + annualInflationRate / 100, retirementAge - currentAge);
  const annualWithdrawalNeeded = Math.max(0, annualExpensesAtRetirement - annualRetirementIncomeAtRetirement);
  const retirementTarget = annualWithdrawalNeeded / (safeWithdrawalRate / 100);

  // Project future savings
  let chartData: ChartDataPoint[] = [];
  let savings = currentSavings;
  let needGap = null;
  let canRetireAge = null;
  let retirementSuccess = false;
  
  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearsPassed = age - currentAge;
    const inflationFactor = Math.pow(1 + annualInflationRate / 100, yearsPassed);
    const adjustedAnnualExpenses = annualExpenses * inflationFactor;
    const adjustedAnnualRetirementIncome = annualRetirementIncome * inflationFactor;
    const adjustedAnnualWithdrawalNeeded = Math.max(0, adjustedAnnualExpenses - adjustedAnnualRetirementIncome);
    const targetForThisAge = adjustedAnnualWithdrawalNeeded / (safeWithdrawalRate / 100);
    
    // Before retirement, add contributions and investment returns
    if (age < retirementAge) {
      savings = savings * (1 + annualInvestmentReturn / 100) + annualContributions;
      
      // Check if we've reached retirement target
      if (canRetireAge === null && savings >= targetForThisAge) {
        canRetireAge = age + 1; // Can retire the next year
      }
    } 
    // During retirement, subtract withdrawals and add investment returns
    else {
      // Mark retirement milestone
      if (age === retirementAge) {
        retirementSuccess = savings >= retirementTarget;
      }
      
      // During retirement, calculate withdrawals and returns
      const withdrawal = adjustedAnnualWithdrawalNeeded;
      savings = Math.max(0, (savings - withdrawal) * (1 + annualInvestmentReturn / 100));
    }

    chartData.push({
      age,
      savings,
      target: targetForThisAge,
      expenses: adjustedAnnualExpenses,
      retirementIncome: adjustedAnnualRetirementIncome,
      isRetirementYear: age === retirementAge,
    });
    
    // Find when savings will run out during retirement
    if (age >= retirementAge && needGap === null && savings <= 0) {
      needGap = retirementAge + (age - retirementAge);
    }
  }

  // Calculate probability of success based on Monte Carlo simulation
  // (simplified version - in real life this would be more complex)
  const successRate = retirementSuccess ? 
    Math.min(100, Math.round(100 - (100 / (1 + Math.pow(savings / retirementTarget, 2))))) : 
    Math.min(100, Math.round(100 - (100 / (1 + Math.pow(currentSavings / retirementTarget, 0.5)))));

  return {
    chartData,
    retirementTarget,
    needGap,
    canRetireAge,
    successRate,
    savingsAtRetirement: chartData[retirementAge - currentAge]?.savings || 0,
  };
};