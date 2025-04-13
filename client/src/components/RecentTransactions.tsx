import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const RecentTransactions = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    select: (data) => data?.slice(0, 6) || [], // Get only the first 6 transactions
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
        <CardHeader className="p-4 border-b border-gray-200 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          <Link href="/transactions">
            <a className="text-sm text-primary hover:text-blue-700">View All</a>
          </Link>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <Skeleton className="w-8 h-8 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
        <CardHeader className="p-4 border-b border-gray-200 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          <Link href="/transactions">
            <a className="text-sm text-primary hover:text-blue-700">View All</a>
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-48">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-12 h-12 mb-3">
              <rect width="20" height="14" x="2" y="5" rx="2"></rect>
              <line x1="2" x2="22" y1="10" y2="10"></line>
            </svg>
            <p className="text-gray-500 mb-2">No transactions yet</p>
            <p className="text-sm text-gray-400 text-center">Connect accounts to see your recent transactions here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (transaction: any) => {
    let categoryName = '';
    if (transaction.category) {
      if (Array.isArray(transaction.category)) {
        categoryName = transaction.category[0] || '';
      } else if (typeof transaction.category === 'object') {
        categoryName = Object.keys(transaction.category)[0] || '';
      } else {
        categoryName = transaction.category || '';
      }
    }
    
    categoryName = categoryName.toLowerCase();

    if (categoryName.includes('food') || categoryName.includes('restaurant')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
          <path d="M7 2v20"></path>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
        </svg>
      );
    } else if (categoryName.includes('shop')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      );
    } else if (categoryName.includes('utility') || categoryName.includes('electric')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <path d="M8 12a2 2 0 0 0 4 0 2 2 0 0 0-4 0"></path>
          <path d="M7 19h10a2 2 0 0 0 1.84-1.23L21.83 7a1.5 1.5 0 0 0-1.39-2H3.56a1.5 1.5 0 0 0-1.39 2L5.17 17.77A2 2 0 0 0 7 19"></path>
          <path d="M2 7h20"></path>
        </svg>
      );
    } else if (categoryName.includes('transport') || categoryName.includes('travel')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <path d="M9 17h6"></path>
          <path d="M10 9h1"></path>
          <path d="M13 9h1"></path>
          <path d="M19 17h1a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1"></path>
          <path d="M5 17H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1"></path>
          <rect width="14" height="14" x="5" y="3" rx="2"></rect>
        </svg>
      );
    } else if (categoryName.includes('salary') || categoryName.includes('income') || categoryName.includes('transfer')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <rect width="20" height="14" x="2" y="5" rx="2"></rect>
          <line x1="2" x2="22" y1="10" y2="10"></line>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-4 h-4">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <path d="M12 17h.01"></path>
        </svg>
      );
    }
  };

  const getCategory = (transaction: any) => {
    if (!transaction.category) return 'Uncategorized';
    
    if (Array.isArray(transaction.category)) {
      return transaction.category[0] || 'Uncategorized';
    } else if (typeof transaction.category === 'object') {
      return Object.keys(transaction.category)[0] || 'Uncategorized';
    } else {
      return transaction.category || 'Uncategorized';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
      <CardHeader className="p-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
        <Link href="/transactions">
          <a className="text-sm text-primary hover:text-blue-700">View All</a>
        </Link>
      </CardHeader>
      <CardContent className="p-2">
        <div className="overflow-hidden">
          {transactions.map((transaction: any) => {
            const isDebit = Number(transaction.amount) > 0;
            const formattedAmount = formatCurrency(Math.abs(transaction.amount));
            const displayAmount = isDebit ? `-${formattedAmount}` : `+${formattedAmount}`;
            
            return (
              <div key={transaction.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      {getCategoryIcon(transaction)}
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
                    <p className={`font-medium ${isDebit ? 'text-red-500' : 'text-green-600'}`}>
                      {displayAmount}
                    </p>
                    <p className="text-xs text-gray-500">{getCategory(transaction)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
