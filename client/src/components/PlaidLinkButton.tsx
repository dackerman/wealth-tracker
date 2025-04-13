import { useEffect } from "react";
import { usePlaid } from "@/App";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { linkToken, setLinkToken } = usePlaid();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load the Plaid Link script if it hasn't been loaded already
  useEffect(() => {
    if (!document.getElementById("plaid-link-script")) {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.id = "plaid-link-script";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch a link token when the component mounts
  const { refetch: fetchLinkToken } = useQuery({
    queryKey: ['/api/plaid/create-link-token'],
    enabled: false,
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating link token",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Handle exchanging the public token after Plaid Link flow completion
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
    // If we don't have a link token, fetch one
    if (!linkToken) {
      await fetchLinkToken();
      return;
    }

    // Check if Plaid is loaded
    if (!window.Plaid) {
      toast({
        title: "Plaid is still loading",
        description: "Please try again in a moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
          // Exchange the public token for an access token
          exchangeTokenMutation.mutate({
            publicToken: public_token,
            institutionId: metadata.institution.institution_id,
            institutionName: metadata.institution.name,
          });
          
          // Reset the link token so a new one is created for the next connection
          setLinkToken(null);
        },
        onExit: () => {
          // Reset the link token when the user exits the flow
          setLinkToken(null);
        },
        onEvent: (eventName: string) => {
          // Optional: track events
          console.log(`Plaid event: ${eventName}`);
        },
      });

      handler.open();
    } catch (error) {
      console.error("Error opening Plaid Link:", error);
      toast({
        title: "Error opening Plaid Link",
        description: "Please try again later",
        variant: "destructive",
      });
      // Reset link token to get a fresh one next time
      setLinkToken(null);
    }
  };

  return (
    <Button 
      onClick={openPlaidLink}
      className={className}
      variant={variant}
      disabled={disabled || exchangeTokenMutation.isPending}
    >
      {exchangeTokenMutation.isPending ? (
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
