import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AddAccountModal from "@/components/AddAccountModal";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  BarChart3,
  Wallet,
  ArrowUpDown,
  Target,
  ChevronDown,
  X,
  PlusCircle,
  RefreshCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import logos
import logoPath from "@/assets/logo.png";
import logoHorizontalPath from "@/assets/logo-horizontal.png";
import logoMatrixPath from "@/assets/logo-matrix.png";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/refresh", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth/history"] });

      toast({
        title: "Data refreshed",
        description: "Your financial data has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // If we're on the auth page or there's no user, don't show the layout
  if (location === "/auth" || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--wealth-off-white)]">
      {/* Desktop Header */}
      <nav className="wealth-gradient-bg text-white shadow-md">
        <div className="max-w-7xl mx-auto px-0 sm:px-1 lg:px-2">
          <div className="flex justify-between h-44">
            {/* Logo section - visible on all screens */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center pl-0 ml-0">
                <img
                  src={logoMatrixPath}
                  alt="WealthVision Logo"
                  className="h-40"
                />
              </div>
              
              {/* Navigation links - visible only on larger screens */}
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <Link
                  href="/"
                  className={`${
                    location === "/"
                      ? "border-[var(--wealth-light-teal)] text-white"
                      : "border-transparent text-[var(--wealth-light-gray)] hover:border-[var(--wealth-light-gray)] hover:text-white"
                  } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Dashboard
                </Link>
                <Link
                  href="/accounts"
                  className={`${
                    location === "/accounts"
                      ? "border-[var(--wealth-light-teal)] text-white"
                      : "border-transparent text-[var(--wealth-light-gray)] hover:border-[var(--wealth-light-gray)] hover:text-white"
                  } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Wallet className="w-4 h-4 mr-1" />
                  Accounts
                </Link>
                <Link
                  href="/transactions"
                  className={`${
                    location === "/transactions"
                      ? "border-[var(--wealth-light-teal)] text-white"
                      : "border-transparent text-[var(--wealth-light-gray)] hover:border-[var(--wealth-light-gray)] hover:text-white"
                  } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium`}
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Transactions
                </Link>
                <Link
                  href="/goals"
                  className={`${
                    location === "/goals"
                      ? "border-[var(--wealth-light-teal)] text-white"
                      : "border-transparent text-[var(--wealth-light-gray)] hover:border-[var(--wealth-light-gray)] hover:text-white"
                  } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Target className="w-4 h-4 mr-1" />
                  Goals
                </Link>
              </div>
            </div>
            
            {/* Desktop action buttons */}
            <div className="flex items-center">
              {/* Show these buttons only on medium screens and above */}
              <div className="hidden md:flex md:items-center">
                <button
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                  className="mr-4 p-1 rounded-full text-[var(--wealth-light-gray)] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--wealth-light-teal)]"
                  title="Refresh data"
                >
                  <RefreshCcw className={`w-5 h-5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh data</span>
                </button>

                <Button
                  onClick={openModal}
                  variant="outline"
                  className="mr-4 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Account
                </Button>

                {/* User menu dropdown - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 p-1 text-white hover:bg-white/20 hover:text-white"
                    >
                      <span className="mr-1">{user.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 mt-2"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Account
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Manage your profile
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile hamburger menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-1 rounded-full text-[var(--wealth-light-gray)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--wealth-light-teal)]"
                aria-label="Open mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
          id="mobile-menu"
        >
          <div className="px-2 py-1 border-t border-[var(--wealth-teal)]">
            
            {/* User and Close Button */}
            <div className="flex justify-between items-center py-1">
              <div className="text-white font-medium">
                {user.username}
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-1 rounded-full text-[var(--wealth-light-gray)] hover:text-white"
                aria-label="Close mobile menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pb-1 space-y-0.5">
            {/* Navigation Links */}
            <Link
              href="/"
              className={`${
                location === "/"
                  ? "bg-[var(--wealth-teal)] border-[var(--wealth-light-teal)] text-white"
                  : "border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white"
              } block pl-3 pr-4 py-1 border-l-4 text-base font-medium flex items-center`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/accounts"
              className={`${
                location === "/accounts"
                  ? "bg-[var(--wealth-teal)] border-[var(--wealth-light-teal)] text-white"
                  : "border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white"
              } block pl-3 pr-4 py-1 border-l-4 text-base font-medium flex items-center`}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Accounts
            </Link>
            <Link
              href="/transactions"
              className={`${
                location === "/transactions"
                  ? "bg-[var(--wealth-teal)] border-[var(--wealth-light-teal)] text-white"
                  : "border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white"
              } block pl-3 pr-4 py-1 border-l-4 text-base font-medium flex items-center`}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Transactions
            </Link>
            <Link
              href="/goals"
              className={`${
                location === "/goals"
                  ? "bg-[var(--wealth-teal)] border-[var(--wealth-light-teal)] text-white"
                  : "border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white"
              } block pl-3 pr-4 py-1 border-l-4 text-base font-medium flex items-center`}
            >
              <Target className="w-4 h-4 mr-2" />
              Goals
            </Link>

            {/* Actions Section */}
            <div className="border-t border-[var(--wealth-teal)]/50 pt-1 mt-1">
              <button
                onClick={openModal}
                className="border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white w-full text-left flex items-center pl-3 pr-4 py-1 border-l-4 text-base font-medium"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Account
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                className="border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white w-full text-left flex items-center pl-3 pr-4 py-1 border-l-4 text-base font-medium"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
              
              <button
                onClick={handleLogout}
                className="border-transparent text-[var(--wealth-light-gray)] hover:bg-[var(--wealth-teal)]/70 hover:text-white w-full text-left flex items-center pl-3 pr-4 py-1 border-l-4 text-base font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Add Account Modal */}
      {isModalOpen && (
        <AddAccountModal isOpen={isModalOpen} onClose={closeModal} />
      )}
    </div>
  );
};

export default MainLayout;
