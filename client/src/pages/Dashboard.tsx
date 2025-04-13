import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import NetWorthSummary from "@/components/NetWorthSummary";
import HistoricalNetWorth from "@/components/HistoricalNetWorth";
import AccountsList from "@/components/AccountsList";
import RecentTransactions from "@/components/RecentTransactions";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: ['/api/net-worth/summary'],
  });

  const { data: lastUpdated, isLoading: isLastUpdatedLoading } = useQuery({
    queryKey: ['/api/institutions'],
    select: (data) => {
      // Find the most recent lastUpdated date
      if (!data || data.length === 0) return null;
      return data.reduce(
        (latest: Date | null, institution: any) => {
          const currentDate = new Date(institution.lastUpdated);
          return !latest || currentDate > latest ? currentDate : latest;
        },
        null
      );
    },
  });

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Never";
    
    // Format date as "Today, 2:45 PM" or "Oct 15, 2:45 PM"
    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    
    const timeString = date.toLocaleTimeString('en-US', timeOptions);
    const dateString = date.toLocaleDateString('en-US', dateOptions);
    
    return isToday ? `Today, ${timeString}` : `${dateString}, ${timeString}`;
  };

  return (
    <>
      {/* Last updated info */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <div className="text-sm text-gray-500">
          <span>Last updated: </span>
          {isLastUpdatedLoading ? (
            <Skeleton className="h-4 w-24 inline-block" />
          ) : (
            <span>{formatLastUpdated(lastUpdated)}</span>
          )}
        </div>
      </div>

      {/* Net Worth Summary */}
      <NetWorthSummary />

      {/* Historical Net Worth */}
      <HistoricalNetWorth />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List */}
        <div className="lg:col-span-2">
          <AccountsList />
        </div>

        {/* Recent Transactions */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
