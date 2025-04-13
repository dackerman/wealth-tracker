import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter transactions by search term and period
  const filteredTransactions = transactions
    ? transactions.filter((transaction: any) => {
        // Search filter
        const searchMatch = 
          transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.merchantName && transaction.merchantName.toLowerCase().includes(searchTerm.toLowerCase()));

        // Period filter
        let periodMatch = true;
        if (periodFilter !== "all") {
          const transactionDate = new Date(transaction.date);
          const now = new Date();
          
          if (periodFilter === "7d") {
            const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
            periodMatch = transactionDate >= sevenDaysAgo;
          } else if (periodFilter === "30d") {
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            periodMatch = transactionDate >= thirtyDaysAgo;
          } else if (periodFilter === "90d") {
            const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
            periodMatch = transactionDate >= ninetyDaysAgo;
          }
        }

        return searchMatch && periodMatch;
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <Input
              className="max-w-xs"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={periodFilter} onValueChange={setPeriodFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>

            <TabsContent value={periodFilter}>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-2">
                  {filteredTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <CategoryIcon category={transaction.category} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${Number(transaction.amount) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {Number(transaction.amount) > 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.category ? Array.isArray(transaction.category) 
                              ? transaction.category[0] 
                              : typeof transaction.category === 'object' 
                                ? (transaction.category[0] || 'Uncategorized')
                                : 'Uncategorized'
                              : 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "Try a different search term" 
                      : "Connect accounts to see your transactions here."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for transaction category icons
const CategoryIcon = ({ category }: { category: any }) => {
  // Default icon
  let icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m4.9 4.9 14.2 14.2"></path>
    </svg>
  );
  
  // Convert category to string for comparison
  let categoryName = '';
  
  if (category) {
    if (Array.isArray(category)) {
      categoryName = category[0]?.toLowerCase() || '';
    } else if (typeof category === 'object') {
      categoryName = category[0]?.toLowerCase() || '';
    } else if (typeof category === 'string') {
      categoryName = category.toLowerCase();
    }
  }

  // Set icon based on category
  if (categoryName.includes('food') || categoryName.includes('restaurant')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 w-4 h-4">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
        <path d="M7 2v20"></path>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
      </svg>
    );
  } else if (categoryName.includes('shop') || categoryName.includes('merchandise')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 w-4 h-4">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <path d="M3 6h18"></path>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    );
  } else if (categoryName.includes('transfer') || categoryName.includes('payment')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 w-4 h-4">
        <path d="m5 9 14-5"></path>
        <path d="M5 9v6.8"></path>
        <path d="m5 15.8 3.2.7"></path>
        <path d="M8.2 16.5h7.1"></path>
        <path d="m15.3 16.5 3.7.8"></path>
        <path d="M19 17.3V9"></path>
        <path d="m5 9 4 1.7"></path>
        <path d="M9 10.7h5.3"></path>
        <path d="m14.3 10.7 4.7 2"></path>
      </svg>
    );
  } else if (categoryName.includes('travel') || categoryName.includes('transport')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 w-4 h-4">
        <path d="M6 17h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"></path>
        <path d="M15 17v2"></path>
        <path d="M9 17v2"></path>
        <path d="M4 9v2"></path>
        <path d="M4 13v2"></path>
        <path d="M20 9v2"></path>
        <path d="M20 13v2"></path>
      </svg>
    );
  } else if (categoryName.includes('utility') || categoryName.includes('bill')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 w-4 h-4">
        <path d="M12 2v4"></path>
        <path d="m6.31 6.31 2.83 2.83"></path>
        <path d="M2 12h4"></path>
        <path d="m6.31 17.69 2.83-2.83"></path>
        <path d="M12 22v-4"></path>
        <path d="m17.69 17.69-2.83-2.83"></path>
        <path d="M22 12h-4"></path>
        <path d="m17.69 6.31-2.83 2.83"></path>
      </svg>
    );
  } else if (categoryName.includes('income') || categoryName.includes('deposit')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 w-4 h-4">
        <path d="M2 16V8a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    );
  }

  return icon;
};

export default Transactions;
