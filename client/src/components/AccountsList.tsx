import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { formatCurrency } from "@/lib/utils";

const AccountsList = () => {
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['/api/accounts'],
  });

  const { data: institutions, isLoading: isInstitutionsLoading } = useQuery({
    queryKey: ['/api/institutions'],
  });

  if (isAccountsLoading || isInstitutionsLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter accounts based on the selected account type
  const filteredAccounts = accounts && accountTypeFilter !== "all"
    ? accounts.filter((account: any) => account.type === accountTypeFilter)
    : accounts || [];

  // Get unique account types for the filter buttons
  const accountTypes = accounts
    ? [...new Set(accounts.map((account: any) => account.type))]
    : [];

  // Get institution details for an account
  const getInstitutionForAccount = (account: any) => {
    if (!institutions) return null;
    return institutions.find((i: any) => i.id === account.institutionId);
  };

  // Get icon based on account type
  const getAccountIcon = (account: any) => {
    const type = account.type;
    const subtype = account.subtype;

    if (type === 'depository') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-5 h-5">
          <path d="M4 11h16a1 1 0 0 1 1 1v.5c0 .5-.5 1-1 1H4c-.5 0-1-.5-1-1V12a1 1 0 0 1 1-1Z"></path>
          <path d="M18 20H6a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2Z"></path>
          <path d="M12 4v7"></path>
          <path d="m15 7-3-3-3 3"></path>
        </svg>
      );
    } else if (type === 'investment') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 w-5 h-5">
          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          <path d="m13 13 6 6"></path>
        </svg>
      );
    } else if (type === 'credit') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 w-5 h-5">
          <rect width="20" height="14" x="2" y="5" rx="2"></rect>
          <line x1="2" x2="22" y1="10" y2="10"></line>
        </svg>
      );
    } else if (type === 'loan') {
      if (subtype === 'mortgage') {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 w-5 h-5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      } else {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 w-5 h-5">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="2"></circle>
          </svg>
        );
      }
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 w-5 h-5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={accountTypeFilter === "all" ? "default" : "outline"}
            onClick={() => setAccountTypeFilter("all")}
            className="px-4 py-2 h-9 text-sm font-medium"
          >
            All
          </Button>
          {accountTypes.map((type) => (
            <Button
              key={type}
              variant={accountTypeFilter === type ? "default" : "outline"}
              onClick={() => setAccountTypeFilter(type)}
              className="px-4 py-2 h-9 text-sm font-medium"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Account list */}
        <div className="space-y-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account: any) => {
              const institution = getInstitutionForAccount(account);
              const isNegativeBalance = Number(account.currentBalance) < 0;
              const formattedBalance = formatCurrency(
                isNegativeBalance ? -Number(account.currentBalance) : Number(account.currentBalance)
              );
              
              // Format last updated time
              const lastUpdated = new Date(account.lastUpdated);
              const now = new Date();
              const diffMs = now.getTime() - lastUpdated.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              
              let lastUpdatedText;
              if (diffHours < 1) {
                lastUpdatedText = "Updated just now";
              } else if (diffHours === 1) {
                lastUpdatedText = "Updated 1 hour ago";
              } else if (diffHours < 24) {
                lastUpdatedText = `Updated ${diffHours} hours ago`;
              } else {
                lastUpdatedText = `Updated ${Math.floor(diffHours / 24)} days ago`;
              }

              return (
                <div key={account.id} className="account-pill bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        {getAccountIcon(account)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{institution?.name || "Unknown"}</h3>
                        <p className="text-sm text-gray-500">{account.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${isNegativeBalance ? 'text-red-500' : 'text-gray-900'}`}>
                        {isNegativeBalance ? `-${formattedBalance}` : formattedBalance}
                      </div>
                      <div className="text-xs text-gray-500">{lastUpdatedText}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No accounts found.</p>
              <PlaidLinkButton />
            </div>
          )}

          <Button
            onClick={() => {}}
            variant="outline"
            className="w-full py-2 text-primary border border-primary border-dashed rounded-lg hover:bg-blue-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Connect Another Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountsList;
