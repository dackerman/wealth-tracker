import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const HistoricalNetWorth = () => {
  const [period, setPeriod] = useState("3M"); // Default to 3 months

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/net-worth/history', period],
    queryFn: async () => {
      const response = await fetch(`/api/net-worth/history?period=${period}`);
      if (!response.ok) {
        throw new Error("Failed to fetch net worth history");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Net Worth History</h2>
              <p className="text-sm text-gray-500">Track your progress over time</p>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-gray-500">Unable to load net worth history. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data?.map((entry: any) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    netWorth: Number(entry.netWorth),
    assets: Number(entry.totalAssets),
    liabilities: Number(entry.totalLiabilities),
    timestamp: new Date(entry.date).getTime(),
  })).sort((a: any, b: any) => a.timestamp - b.timestamp) || [];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow rounded border border-gray-200">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-sm text-green-600">Assets: {formatCurrency(payload[1]?.value)}</p>
          <p className="text-sm text-red-500">Liabilities: {formatCurrency(payload[2]?.value)}</p>
          <p className="text-sm font-bold text-primary mt-1">Net Worth: {formatCurrency(payload[0]?.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Net Worth History</h2>
            <p className="text-sm text-gray-500">Track your progress over time</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant={period === "1M" ? "default" : "outline"} 
              onClick={() => setPeriod("1M")}
              className="px-3 py-1 h-8 text-sm"
            >
              1M
            </Button>
            <Button 
              variant={period === "3M" ? "default" : "outline"} 
              onClick={() => setPeriod("3M")}
              className="px-3 py-1 h-8 text-sm"
            >
              3M
            </Button>
            <Button 
              variant={period === "6M" ? "default" : "outline"} 
              onClick={() => setPeriod("6M")}
              className="px-3 py-1 h-8 text-sm"
            >
              6M
            </Button>
            <Button 
              variant={period === "1Y" ? "default" : "outline"} 
              onClick={() => setPeriod("1Y")}
              className="px-3 py-1 h-8 text-sm"
            >
              1Y
            </Button>
            <Button 
              variant={period === "All" ? "default" : "outline"} 
              onClick={() => setPeriod("All")}
              className="px-3 py-1 h-8 text-sm"
            >
              All
            </Button>
          </div>
        </div>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={[(dataMin: number) => Math.floor(dataMin * 0.9), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="netWorth" stroke="#3B82F6" activeDot={{ r: 8 }} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="assets" stroke="#10B981" strokeWidth={1.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="liabilities" stroke="#EF4444" strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No historical net worth data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalNetWorth;
