import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// @ts-ignore - Plaid Link script is loaded at runtime
declare global {
  interface Window {
    Plaid: {
      create: (config: any) => { open: () => void, exit: () => void };
    };
  }
}

const PlaidLinkButton = ({ 
  className, 
  variant = "default", 
  children, 
  disabled = false 
}: { 
  className?: string, 
  variant?: "default" | "outline" | "link", 
  children?: React.ReactNode,
  disabled?: boolean
}) => {
  const [isPlaidLoaded, setIsPlaidLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load the Plaid Link script
  useEffect(() => {
    if (!document.getElementById("plaid-link-script")) {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.id = "plaid-link-script";
      script.async = true;
      script.onload = () => {
        console.log("Plaid script loaded");
        setIsPlaidLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      // Script already exists, check if Plaid is defined
      if (window.Plaid) {
        setIsPlaidLoaded(true);
      }
    }
  }, []);

  // Handle exchanging the public token for an access token
  const exchangeTokenMutation = useMutation({
    mutationFn: async (data: { publicToken: string, institutionId: string, institutionName: string }) => {
      return apiRequest('POST', '/api/plaid/exchange-public-token', data);
    },
    onSuccess: () => {
      toast({
        title: "Account connected successfully",
        description: "Your financial data is now being synced",
      });
      
      // Invalidate all relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/institutions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect account",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const openPlaidLink = async () => {
    if (!isPlaidLoaded) {
      toast({
        title: "Plaid is still loading",
        description: "Please try again in a moment",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get a link token from our server
      const response = await fetch('/api/plaid/create-link-token');
      if (!response.ok) {
        throw new Error('Failed to create link token');
      }
      
      const { linkToken } = await response.json();
      console.log("Link token received:", linkToken);
      
      if (!linkToken) {
        throw new Error('No link token received');
      }
      
      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (publicToken: string, metadata: any) => {
          console.log("Plaid Link success", publicToken, metadata);
          // Exchange the public token for an access token
          exchangeTokenMutation.mutate({
            publicToken,
            institutionId: metadata.institution.institution_id,
            institutionName: metadata.institution.name,
          });
        },
        onExit: (err: any) => {
          console.log("Plaid Link exit", err);
          setIsLoading(false);
          
          if (err) {
            toast({
              title: "Link connection error",
              description: err.error_message || "Error connecting to your bank",
              variant: "destructive",
            });
          }
        },
        onEvent: (eventName: string) => {
          console.log("Plaid Link event:", eventName);
        },
      });

      handler.open();
    } catch (error: any) {
      console.error("Error opening Plaid Link:", error);
      toast({
        title: "Error opening Plaid Link",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={openPlaidLink}
      className={className}
      variant={variant}
      disabled={disabled || isLoading || exchangeTokenMutation.isPending}
    >
      {isLoading || exchangeTokenMutation.isPending ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : children || (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Account
        </>
      )}
    </Button>
  );
};

export default PlaidLinkButton;
