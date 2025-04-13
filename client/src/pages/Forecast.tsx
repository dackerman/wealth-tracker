import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import MainLayout from "@/layouts/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { 
  Info, 
  TrendingUp, 
  Wallet, 
  Landmark, 
  ArrowUp, 
  ArrowDown, 
  PiggyBank, 
  Gift,
  PlusCircle,
  Trash2,
  ArrowUpDown,
  Edit3,
  Copy,
  Save,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";

// Form schema for retirement calculator
const forecastFormSchema = z.object({
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

type ForecastFormValues = z.infer<typeof forecastFormSchema>;

// Default values for the form
const defaultValues: ForecastFormValues = {
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

// Calculations for retirement forecasting
const calculateForecastData = (values: ForecastFormValues) => {
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
  let chartData = [];
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

function CurrencyInput({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    // Format when value changes externally
    if (value !== undefined && value !== null) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept only numbers and decimals during typing
    const inputVal = e.target.value;
    if (inputVal === "" || /^[0-9]*\.?[0-9]*$/.test(inputVal)) {
      setDisplayValue(inputVal);
      onChange(inputVal === "" ? 0 : parseFloat(inputVal));
    }
  };

  const handleBlur = () => {
    // Format nicely on blur
    if (displayValue) {
      const numValue = parseFloat(displayValue);
      setDisplayValue(numValue.toString());
    }
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="pl-8"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

function PercentageInput({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    // Format when value changes externally
    if (value !== undefined && value !== null) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept only numbers and decimals during typing
    const inputVal = e.target.value;
    if (inputVal === "" || /^[0-9]*\.?[0-9]*$/.test(inputVal)) {
      setDisplayValue(inputVal);
      onChange(inputVal === "" ? 0 : parseFloat(inputVal));
    }
  };

  const handleBlur = () => {
    // Format nicely on blur
    if (displayValue) {
      const numValue = parseFloat(displayValue);
      setDisplayValue(numValue.toString());
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="pr-8"
        placeholder={placeholder}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
    </div>
  );
}

// Define the NetWorthSummary interface
interface NetWorthSummary {
  netWorth: string;
  totalAssets: string;
  totalLiabilities: string;
}

// Create a scenario type
interface RetirementScenario {
  id: string;
  name: string;
  description?: string;
  formValues: ForecastFormValues;
  calculatedData: any;
  color: string;
  createdAt: Date;
}

// Colors for scenarios
const scenarioColors = [
  "#0ea5e9", // sky-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
];

export default function ForecastPage() {
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("calculator");
  
  // Add state for scenarios
  const [scenarios, setScenarios] = useState<RetirementScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  // Define the form with default values first
  const form = useForm<ForecastFormValues>({
    resolver: zodResolver(forecastFormSchema),
    defaultValues,
  });
  
  // Get user's current net worth
  const { data: netWorthSummary } = useQuery<NetWorthSummary>({
    queryKey: ['/api/net-worth/summary'],
  });

  // Determine the user's total assets if available from API
  useEffect(() => {
    if (netWorthSummary?.totalAssets) {
      form.setValue('currentSavings', parseFloat(netWorthSummary.totalAssets));
    }
  }, [netWorthSummary]);

  const watchedValues = form.watch();

  // Update forecast when form values change
  useEffect(() => {
    // Only calculate if we have valid data
    if (Object.keys(form.formState.errors).length === 0) {
      try {
        const calculatedData = calculateForecastData(watchedValues);
        setForecastData(calculatedData);
      } catch (error) {
        console.error("Calculation error:", error);
      }
    }
  }, [watchedValues, form.formState.errors]);

  const onSubmit = (data: ForecastFormValues) => {
    const calculatedData = calculateForecastData(data);
    setForecastData(calculatedData);
    setActiveTab("results");
  };

  // Check if we have retirement shortfall or surplus
  const retirementShortfall = forecastData?.retirementTarget - forecastData?.savingsAtRetirement;
  const hasShortfall = retirementShortfall > 0;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--wealth-dark-teal)]">
            Retirement Forecast
          </h1>
          <p className="text-muted-foreground">
            Plan for your future by forecasting your retirement needs and timeline.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="calculator">
              Calculator
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!forecastData}>
              Results & Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-4">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Retirement Calculator</CardTitle>
                    <CardDescription>
                      Adjust the parameters below to see when you can retire
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="currentAge"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Age</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="retirementAge"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Retirement Age</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="currentSavings"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Savings/Investments</FormLabel>
                                <FormControl>
                                  <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your current net worth from all accounts
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="monthlyExpenses"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Expenses (in Retirement)</FormLabel>
                                <FormControl>
                                  <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Estimated monthly expenses during retirement
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="monthlyContributions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Contributions</FormLabel>
                                <FormControl>
                                  <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormDescription>
                                  How much you save each month
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="annualInvestmentReturn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Investment Return (%)</FormLabel>
                                  <FormControl>
                                    <PercentageInput
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="annualInflationRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Inflation Rate (%)</FormLabel>
                                  <FormControl>
                                    <PercentageInput
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="retirementIncome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Retirement Income</FormLabel>
                                <FormControl>
                                  <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Social Security, pension, etc. (monthly)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="safeWithdrawalRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Safe Withdrawal Rate (%)</FormLabel>
                                  <FormControl>
                                    <PercentageInput
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Typically 4% (Trinity study)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="lifeExpectancy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Life Expectancy</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full">Calculate Retirement Plan</Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-[var(--wealth-light-blue-bg)] border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="h-5 w-5 mr-2 text-[var(--wealth-light-teal)]" />
                      About the 4% Rule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <p>
                        The <strong>4% Rule</strong> is a guideline for retirement withdrawals, suggesting you can safely withdraw 4% of your initial portfolio in your first year of retirement, then adjust that amount for inflation each year.
                      </p>
                      <p>
                        Based on historical data, this approach gives your portfolio a high probability of lasting 30+ years through various market conditions.
                      </p>
                      <p>
                        <strong>Example:</strong> With $1,000,000 saved, you could withdraw $40,000 in year one, then adjust that amount for inflation in subsequent years.
                      </p>
                      <div className="mt-4">
                        <p className="font-medium">To calculate your retirement target:</p>
                        <ol className="ml-4 mt-2 list-decimal space-y-1">
                          <li>Estimate your annual expenses in retirement</li>
                          <li>Subtract any guaranteed income (Social Security, pension)</li>
                          <li>Divide the result by 4% (or multiply by 25)</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {forecastData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Results</CardTitle>
                      <CardDescription>
                        Key metrics based on your current inputs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[var(--wealth-light-blue-bg)] rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Target Amount</div>
                            <div className="text-2xl font-bold text-[var(--wealth-dark-teal)]">
                              {formatCurrency(forecastData.retirementTarget)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Needed at age {watchedValues.retirementAge}
                            </div>
                          </div>
                          
                          <div className="bg-[var(--wealth-light-blue-bg)] rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Projected Savings</div>
                            <div className="text-2xl font-bold text-[var(--wealth-dark-teal)]">
                              {formatCurrency(forecastData.savingsAtRetirement)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              At age {watchedValues.retirementAge}
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-lg ${hasShortfall ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                          <div className="flex items-center">
                            {hasShortfall ? (
                              <ArrowDown className="h-5 w-5 mr-2 text-red-500" />
                            ) : (
                              <ArrowUp className="h-5 w-5 mr-2 text-green-500" />
                            )}
                            <div>
                              <div className="font-medium">
                                {hasShortfall ? 'Retirement Shortfall' : 'Retirement Surplus'}
                              </div>
                              <div className="text-sm opacity-90">
                                {hasShortfall 
                                  ? 'You may need to save more or adjust your plan' 
                                  : 'You are on track for your retirement goals'}
                              </div>
                            </div>
                          </div>
                          <div className="text-xl font-bold">
                            {formatCurrency(Math.abs(retirementShortfall))}
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-medium">Financial Independence</div>
                            <div className="text-sm text-muted-foreground">
                              {forecastData.canRetireAge 
                                ? `Possible at age ${forecastData.canRetireAge}` 
                                : "Not achieved within timeframe"}
                            </div>
                          </div>
                          <div className={`text-lg font-semibold ${forecastData.canRetireAge ? 'text-green-600' : 'text-amber-600'}`}>
                            {forecastData.canRetireAge 
                              ? (forecastData.canRetireAge > watchedValues.retirementAge 
                                  ? `+${forecastData.canRetireAge - watchedValues.retirementAge} years` 
                                  : `-${watchedValues.retirementAge - forecastData.canRetireAge} years`)
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            {forecastData && (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Retirement Projection</CardTitle>
                      <CardDescription>
                        Visual forecast of your retirement savings over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={forecastData.chartData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="age" 
                              label={{ value: 'Age', position: 'insideBottomRight', offset: 0 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `${new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short',
                                maximumFractionDigits: 1,
                              }).format(value)}`}
                              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => `Age: ${label}`}
                            />
                            <Legend />
                            <ReferenceLine 
                              x={watchedValues.retirementAge} 
                              label="Retirement" 
                              stroke="#ff7300" 
                              strokeDasharray="3 3" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="target" 
                              name="Target Needed" 
                              stroke="#8884d8" 
                              fill="#8884d8" 
                              fillOpacity={0.1}
                              activeDot={{ r: 8 }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="savings" 
                              name="Projected Savings" 
                              stroke="#82ca9d" 
                              fill="#82ca9d" 
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-[var(--wealth-light-blue-bg)] rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Success Probability</div>
                          <div className="text-2xl font-bold text-[var(--wealth-dark-teal)]">
                            {forecastData.successRate}%
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Based on your inputs
                          </div>
                        </div>
                        
                        <div className="bg-[var(--wealth-light-blue-bg)] rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Funds Depleted</div>
                          <div className="text-2xl font-bold text-[var(--wealth-dark-teal)]">
                            {forecastData.needGap ? `Age ${forecastData.needGap}` : "Never"}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {forecastData.needGap 
                              ? `${forecastData.needGap - watchedValues.retirementAge} years into retirement` 
                              : "Your funds should last for life"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Retirement Income Analysis</CardTitle>
                      <CardDescription>
                        Breakdown of your retirement income sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {watchedValues.retirementAge && forecastData.chartData && (
                          <>
                            {/* Get the data at retirement age */}
                            {(() => {
                              const retirementIndex = watchedValues.retirementAge - watchedValues.currentAge;
                              const retirementData = forecastData.chartData[retirementIndex] || {};
                              
                              const portfolioWithdrawal = Math.max(0, retirementData.expenses - retirementData.retirementIncome);
                              const totalIncome = portfolioWithdrawal + retirementData.retirementIncome;
                              
                              const portfolioWithdrawalPercent = (portfolioWithdrawal / totalIncome) * 100;
                              const retirementIncomePercent = (retirementData.retirementIncome / totalIncome) * 100;
                              
                              return (
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <div className="text-sm text-muted-foreground">Income Source</div>
                                    <div className="text-sm text-muted-foreground">Amount (Monthly)</div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-[var(--wealth-teal)] mr-2"></div>
                                        <span>Portfolio Withdrawals</span>
                                      </div>
                                      <div className="font-medium">
                                        {formatCurrency(portfolioWithdrawal / 12)}
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-[var(--wealth-light-teal)] mr-2"></div>
                                        <span>Other Income (Social Security, etc.)</span>
                                      </div>
                                      <div className="font-medium">
                                        {formatCurrency(retirementData.retirementIncome / 12)}
                                      </div>
                                    </div>
                                    
                                    <div className="h-2 bg-gray-200 rounded-full mt-3 mb-1">
                                      <div 
                                        className="h-2 bg-[var(--wealth-teal)] rounded-full" 
                                        style={{ width: `${portfolioWithdrawalPercent}%` }}
                                      ></div>
                                    </div>
                                    
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Portfolio: {Math.round(portfolioWithdrawalPercent)}%</span>
                                      <span>Other Income: {Math.round(retirementIncomePercent)}%</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t mt-4">
                                      <div className="flex justify-between">
                                        <span className="font-medium">Total Monthly Income</span>
                                        <span className="font-bold text-[var(--wealth-dark-teal)]">
                                          {formatCurrency(totalIncome / 12)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between mt-2">
                                        <span className="font-medium">Monthly Expenses</span>
                                        <span className="font-bold text-[var(--wealth-dark-teal)]">
                                          {formatCurrency(retirementData.expenses / 12)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                        
                        <div className={`p-4 rounded-lg mt-4 ${hasShortfall ? 'bg-red-50' : 'bg-green-50'}`}>
                          <div className={`text-lg font-medium ${hasShortfall ? 'text-red-800' : 'text-green-800'}`}>
                            {hasShortfall ? 'Income Warning' : 'Income Sufficient'}
                          </div>
                          <p className={`mt-1 text-sm ${hasShortfall ? 'text-red-700' : 'text-green-700'}`}>
                            {hasShortfall 
                              ? 'Your retirement income may not cover your expenses. Consider increasing savings or reducing expenses.' 
                              : 'Your planned retirement income should cover your expenses.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Retirement Recommendations</CardTitle>
                      <CardDescription>
                        Actionable steps to improve your retirement outlook
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {hasShortfall ? (
                          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                            <div className="text-lg font-medium text-red-800 mb-2">
                              Retirement Funding Gap
                            </div>
                            <p className="text-red-700 mb-3">
                              Based on your current plan, you may face a shortfall of {formatCurrency(retirementShortfall)} at retirement.
                              Here are ways to close this gap:
                            </p>
                            
                            <ul className="space-y-4">
                              <li className="flex">
                                <ArrowUp className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Increase monthly contributions</div>
                                  <div className="text-sm text-red-700 mt-1">
                                    Adding {formatCurrency(Math.ceil(retirementShortfall / (watchedValues.retirementAge - watchedValues.currentAge) / 12))} per month could close the gap by retirement.
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <TrendingUp className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Optimize investment strategy</div>
                                  <div className="text-sm text-red-700 mt-1">
                                    A 1% increase in returns could add {formatCurrency(watchedValues.currentSavings * 0.01 * Math.pow(1.01, watchedValues.retirementAge - watchedValues.currentAge))} by retirement.
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <PiggyBank className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Reduce retirement expenses</div>
                                  <div className="text-sm text-red-700 mt-1">
                                    Lowering monthly expenses by {formatCurrency(Math.ceil(retirementShortfall * (watchedValues.safeWithdrawalRate / 100) / 12))} could eliminate the shortfall.
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <Wallet className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Delay retirement</div>
                                  <div className="text-sm text-red-700 mt-1">
                                    Working {forecastData.canRetireAge ? `until age ${forecastData.canRetireAge}` : "a few more years"} could help you reach your retirement goal.
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                            <div className="text-lg font-medium text-green-800 mb-2">
                              Strong Retirement Outlook
                            </div>
                            <p className="text-green-700 mb-3">
                              You're on track to meet your retirement goals with a projected surplus of {formatCurrency(Math.abs(retirementShortfall))}.
                              Here are ways to further improve your situation:
                            </p>
                            
                            <ul className="space-y-4">
                              <li className="flex">
                                <Gift className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Consider early retirement</div>
                                  <div className="text-sm text-green-700 mt-1">
                                    {forecastData.canRetireAge && forecastData.canRetireAge < watchedValues.retirementAge 
                                      ? `You could potentially retire as early as age ${forecastData.canRetireAge}.`
                                      : "You may be able to retire earlier than planned."}
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <Landmark className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Create a legacy or charitable plan</div>
                                  <div className="text-sm text-green-700 mt-1">
                                    Your surplus could support estate planning or charitable giving goals.
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <TrendingUp className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Reduce investment risk</div>
                                  <div className="text-sm text-green-700 mt-1">
                                    You may be able to adopt a more conservative investment strategy while still meeting your goals.
                                  </div>
                                </div>
                              </li>
                              <li className="flex">
                                <Wallet className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Enhance retirement lifestyle</div>
                                  <div className="text-sm text-green-700 mt-1">
                                    You could potentially increase your retirement budget by {formatCurrency(Math.abs(retirementShortfall) * (watchedValues.safeWithdrawalRate / 100) / 12)} monthly.
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        )}

                        <Accordion type="single" collapsible className="mt-8">
                          <AccordionItem value="item-1">
                            <AccordionTrigger>Understand the 4% Rule</AccordionTrigger>
                            <AccordionContent className="text-sm">
                              <p>
                                The 4% rule is a guideline for how much you can safely withdraw from your retirement savings each year without running out of money. It suggests that you can withdraw 4% of your initial portfolio balance in the first year of retirement, then adjust that amount for inflation each year thereafter.
                              </p>
                              <p className="mt-2">
                                Originally based on the Trinity Study, this approach historically has provided a high probability of your portfolio lasting for a 30-year retirement period, even through market downturns.
                              </p>
                              <p className="mt-2">
                                <strong>Example:</strong> With $1,000,000 in retirement savings, you could withdraw $40,000 in your first year of retirement, then adjust that amount for inflation in subsequent years.
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="item-2">
                            <AccordionTrigger>Impact of Inflation</AccordionTrigger>
                            <AccordionContent className="text-sm">
                              <p>
                                Inflation is the gradual increase in prices and decrease in purchasing power over time. Even moderate inflation can significantly impact your retirement plan over decades.
                              </p>
                              <p className="mt-2">
                                For example, with 3% annual inflation, $5,000 of monthly expenses today would cost about $9,000 per month in 20 years.
                              </p>
                              <p className="mt-2">
                                This calculator accounts for inflation by:
                              </p>
                              <ul className="list-disc ml-5 mt-1 space-y-1">
                                <li>Adjusting your future expenses by the inflation rate</li>
                                <li>Calculating how much additional savings you'll need to cover these higher costs</li>
                                <li>Helping you understand your real (inflation-adjusted) withdrawal needs</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="item-3">
                            <AccordionTrigger>Investment Returns</AccordionTrigger>
                            <AccordionContent className="text-sm">
                              <p>
                                The historical average annual return of the S&P 500 has been around 10% before inflation (about 7% after inflation). However, returns vary significantly by asset allocation:
                              </p>
                              <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li><strong>Conservative (20-30% stocks):</strong> 4-5% average return</li>
                                <li><strong>Balanced (40-60% stocks):</strong> 5-6% average return</li>
                                <li><strong>Growth (70-80% stocks):</strong> 6-8% average return</li>
                                <li><strong>Aggressive (90-100% stocks):</strong> 7-10% average return</li>
                              </ul>
                              <p className="mt-2">
                                Keep in mind that higher returns come with higher risk and volatility. As you approach retirement, you may want to gradually shift to a more conservative allocation.
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Next Steps</CardTitle>
                      <CardDescription>
                        Actions to improve your retirement readiness
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button 
                          onClick={() => setActiveTab("calculator")} 
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Adjust Your Retirement Plan
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start">
                          <PiggyBank className="mr-2 h-4 w-4" />
                          Optimize Your Savings Strategy
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start">
                          <Landmark className="mr-2 h-4 w-4" />
                          Explore Tax-Advantaged Accounts
                        </Button>
                        
                        <Button variant="default" className="w-full justify-start bg-[var(--wealth-teal)] hover:bg-[var(--wealth-dark-teal)]">
                          <Wallet className="mr-2 h-4 w-4" />
                          Download Retirement Report
                        </Button>
                      </div>
                      
                      <div className="mt-6 p-4 bg-[var(--wealth-light-blue-bg)] rounded-lg">
                        <div className="text-sm font-medium">Remember</div>
                        <p className="text-sm mt-1">
                          This forecast is based on your inputs and assumptions. It's a good idea to revisit your retirement plan regularly, especially after major life changes or market events.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}