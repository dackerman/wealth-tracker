import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Goals from "@/pages/Goals";
import MainLayout from "@/layouts/MainLayout";
import { useState, createContext, useContext } from "react";

// Context to manage the Plaid link token
type PlaidContextType = {
  linkToken: string | null;
  setLinkToken: (token: string | null) => void;
};

export const PlaidContext = createContext<PlaidContextType>({
  linkToken: null,
  setLinkToken: () => {},
});

export const usePlaid = () => useContext(PlaidContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/goals" component={Goals} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <PlaidContext.Provider value={{ linkToken, setLinkToken }}>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </PlaidContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
