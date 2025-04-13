import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const NetWorthSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/net-worth/summary'],
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Net Worth</h2>
              <p className="text-sm text-gray-500">Total assets minus liabilities</p>
            </div>
            <div className="mt-2 md:mt-0">
              <Skeleton className="h-8 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium text-gray-700">Assets</h3>
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="h-40">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium text-gray-700">Liabilities</h3>
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="h-40">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Unable to load net worth data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { netWorth, totalAssets, totalLiabilities, percentChange, assetsBreakdown, liabilitiesBreakdown } = data;

  const isPositiveChange = parseFloat(percentChange) >= 0;

  // Prepare data for assets chart
  const assetsData = assetsBreakdown ? [
    { name: 'Cash', value: assetsBreakdown.cash || 0 },
    { name: 'Investments', value: assetsBreakdown.investments || 0 },
    { name: 'Real Estate', value: assetsBreakdown.realEstate || 0 },
    { name: 'Other', value: assetsBreakdown.other || 0 }
  ].filter(item => item.value > 0) : [];

  // Prepare data for liabilities chart
  const liabilitiesData = liabilitiesBreakdown ? [
    { name: 'Mortgage', value: liabilitiesBreakdown.mortgage || 0 },
    { name: 'Credit Cards', value: liabilitiesBreakdown.creditCards || 0 },
    { name: 'Student Loans', value: liabilitiesBreakdown.studentLoans || 0 },
    { name: 'Other', value: liabilitiesBreakdown.other || 0 }
  ].filter(item => item.value > 0) : [];

  // Colors for charts
  const ASSETS_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
  const LIABILITIES_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#A1A1AA'];

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200 text-xs">
          <p className="font-medium">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Net Worth</h2>
            <p className="text-sm text-gray-500">Total assets minus liabilities</p>
          </div>
          <div className="mt-2 md:mt-0">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(netWorth)}</span>
            <span className={`ml-2 text-sm font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 inline ${isPositiveChange ? '' : 'rotate-180'}`}>
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {percentChange}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-medium text-gray-700">Assets</h3>
              <span className="text-xl font-semibold text-green-600">{formatCurrency(totalAssets)}</span>
            </div>
            <div className="h-40">
              {assetsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ASSETS_COLORS[index % ASSETS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No asset data available</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-medium text-gray-700">Liabilities</h3>
              <span className="text-xl font-semibold text-red-500">{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="h-40">
              {liabilitiesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liabilitiesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {liabilitiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LIABILITIES_COLORS[index % LIABILITIES_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No liability data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthSummary;
