import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Common bank names for the quick access buttons
const COMMON_BANKS = [
  { name: "Chase", id: "ins_1" },
  { name: "Bank of America", id: "ins_2" },
  { name: "Wells Fargo", id: "ins_3" },
];

// Schema for manual account creation
const manualAccountSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountType: z.string().min(1, "Account type is required"),
  balance: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Balance must be a valid positive number",
  }),
  isLiability: z.boolean().default(false),
});

type ManualAccountValues = z.infer<typeof manualAccountSchema>;

const AddAccountModal = ({ isOpen, onClose }: AddAccountModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("plaid");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ManualAccountValues>({
    resolver: zodResolver(manualAccountSchema),
    defaultValues: {
      institutionName: "",
      accountName: "",
      accountType: "depository",
      balance: "",
      isLiability: false,
    },
  });

  const manualAccountMutation = useMutation({
    mutationFn: async (values: ManualAccountValues) => {
      return apiRequest('POST', '/api/accounts/manual', {
        institutionName: values.institutionName,
        accountName: values.accountName,
        accountType: values.accountType,
        balance: Number(values.balance),
        isLiability: values.isLiability,
      });
    },
    onSuccess: () => {
      toast({
        title: "Account added successfully",
        description: "Your manual account has been added",
      });
      
      // Invalidate all relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/institutions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth/history'] });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add account",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ManualAccountValues) => {
    manualAccountMutation.mutate(values);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "plaid") {
      form.reset();
    }
  };

  // Filter banks based on search term
  const filteredBanks = COMMON_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Connect a Financial Institution</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Link your accounts securely to automatically import financial data.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="plaid">Connect via Plaid</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="plaid">
            <div className="space-y-3 mb-4">
              {filteredBanks.map(bank => (
                <button 
                  key={bank.id}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-4 h-4">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18-3v3a2 2 0 0 0 2 2h3M3 16v3a2 2 0 0 0 2 2h3m8-2h3a2 2 0 0 0 2-2v-3"></path>
                      </svg>
                    </div>
                    <span>{bank.name}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-4 h-4">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              ))}
            </div>
            <div className="relative mb-4">
              <Input
                type="text" 
                placeholder="Search for your bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 px-3 pr-10"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-3 text-gray-400 w-4 h-4">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <PlaidLinkButton>Launch Plaid</PlaidLinkButton>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="institutionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Chase, Wells Fargo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Checking, Savings, 401(k)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="depository">Depository (Checking/Savings)</SelectItem>
                          <SelectItem value="credit">Credit Card</SelectItem>
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field: { onChange, onBlur: fieldOnBlur, value, ...rest } }) => {
                    // Track if the field is being edited
                    const [isEditing, setIsEditing] = useState(false);
                    
                    // Format the number for display (only when not editing)
                    const formattedValue = !isEditing && value 
                      ? parseFloat(value).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) 
                      : value;
                    
                    return (
                      <FormItem>
                        <FormLabel>Current Balance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              $
                            </div>
                            <Input 
                              {...rest}
                              className="pl-7"
                              type="text" 
                              placeholder="0.00"
                              value={formattedValue}
                              onFocus={() => setIsEditing(true)} 
                              onBlur={(e) => {
                                setIsEditing(false);
                                fieldOnBlur(e);
                              }}
                              onChange={(e) => {
                                // Only process when editing
                                if (isEditing) {
                                  // Allow only numbers and decimal point
                                  const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                                  
                                  // Validate decimal format (prevent multiple decimal points)
                                  const decimalCount = (rawValue.match(/\./g) || []).length;
                                  if (decimalCount <= 1) {
                                    onChange(rawValue);
                                  }
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="isLiability"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Is this a liability?</FormLabel>
                        <FormDescription className="text-xs text-muted-foreground">
                          Turn on if this is a debt like a loan or credit card
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={manualAccountMutation.isPending}
                  >
                    {manualAccountMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : "Add Account"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountModal;
