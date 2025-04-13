import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { formatCurrency } from "@/lib/utils";

const Accounts = () => {
  const [activeTab, setActiveTab] = useState("all");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/accounts'],
  });

  const { data: institutions } = useQuery({
    queryKey: ['/api/institutions'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <PlaidLinkButton />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
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

  // Get account types for filtering
  const accountTypes = accounts
    ? [...new Set(accounts.map((account: any) => account.type))]
    : [];

  // Filter accounts based on active tab
  const filteredAccounts = accounts
    ? activeTab === "all"
      ? accounts
      : accounts.filter((account: any) => account.type === activeTab)
    : [];

  // Group accounts by institution
  const accountsByInstitution: Record<number, any[]> = {};
  
  filteredAccounts.forEach((account: any) => {
    if (!accountsByInstitution[account.institutionId]) {
      accountsByInstitution[account.institutionId] = [];
    }
    accountsByInstitution[account.institutionId].push(account);
  });

  // Get institution details for each group
  const getInstitutionName = (institutionId: number) => {
    if (!institutions) return "Unknown Institution";
    const institution = institutions.find((i: any) => i.id === institutionId);
    return institution ? institution.name : "Unknown Institution";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <PlaidLinkButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 overflow-x-auto flex pb-2 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              {accountTypes.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {Object.keys(accountsByInstitution).length > 0 ? (
                Object.entries(accountsByInstitution).map(([institutionId, accounts]) => (
                  <div key={institutionId} className="space-y-2">
                    <h3 className="font-medium text-gray-700">{getInstitutionName(Number(institutionId))}</h3>
                    
                    {accounts.map((account: any) => (
                      <div key={account.id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {account.type === 'depository' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-5 h-5">
                                  <path d="M4 11h16a1 1 0 0 1 1 1v.5c0 .5-.5 1-1 1H4c-.5 0-1-.5-1-1V12a1 1 0 0 1 1-1Z"></path>
                                  <path d="M18 20H6a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2Z"></path>
                                  <path d="M12 4v7"></path>
                                  <path d="m15 7-3-3-3 3"></path>
                                </svg>
                              )}
                              {account.type === 'investment' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 w-5 h-5">
                                  <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                                  <path d="m13 13 6 6"></path>
                                </svg>
                              )}
                              {account.type === 'credit' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 w-5 h-5">
                                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                  <line x1="2" x2="22" y1="10" y2="10"></line>
                                </svg>
                              )}
                              {account.type === 'loan' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 w-5 h-5">
                                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                  <circle cx="12" cy="13" r="2"></circle>
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{account.name}</h3>
                              <p className="text-sm text-gray-500">{account.subtype || account.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${Number(account.currentBalance) < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                              {formatCurrency(account.currentBalance)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Updated {new Date(account.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
                  <p className="text-gray-500 mb-4">Connect a financial institution to see your accounts here.</p>
                  <PlaidLinkButton />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;
