import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, Lock, User } from "lucide-react";
import logoPath from "@/assets/logo.png";

// Create validation schemas for login and registration
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      {/* Form Column */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <img src={logoPath} alt="WealthVision Logo" className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold wealth-gradient-text">WealthVision</h1>
            <p className="text-[var(--wealth-slate)] mt-2">
              Your financial future, clearly in sight
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[var(--wealth-light-gray)]/30">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-[var(--wealth-teal)] data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-[var(--wealth-teal)] data-[state=active]:text-white"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Column */}
      <div className="hidden md:flex flex-col justify-center items-center wealth-gradient-bg p-10">
        <div className="max-w-md space-y-8 text-white">
          <h2 className="text-4xl font-bold tracking-tight">
            Take control of your financial future
          </h2>
          
          <div className="h-1 w-16 bg-[var(--wealth-light-teal)]"></div>
          
          <ul className="space-y-6">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                <span className="text-[var(--wealth-light-teal)] text-sm">✓</span>
              </div>
              <span className="text-lg">Connect with your financial institutions securely via Plaid</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                <span className="text-[var(--wealth-light-teal)] text-sm">✓</span>
              </div>
              <span className="text-lg">Track your net worth and watch your wealth grow over time</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                <span className="text-[var(--wealth-light-teal)] text-sm">✓</span>
              </div>
              <span className="text-lg">Set financial goals and monitor your progress toward success</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                <span className="text-[var(--wealth-light-teal)] text-sm">✓</span>
              </div>
              <span className="text-lg">Analyze your spending and income patterns with intuitive charts</span>
            </li>
          </ul>
          
          <div className="pt-4 opacity-80 italic text-sm">
            "The secret to getting ahead is getting started." — Mark Twain
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const isPending = loginMutation.isPending;
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--wealth-dark-slate)] font-medium">Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[var(--wealth-slate)]/60" />
                  <Input 
                    placeholder="Enter your username" 
                    className="pl-10 py-6 bg-[var(--wealth-light-gray)]/20 border-[var(--wealth-light-gray)]" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--wealth-dark-slate)] font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--wealth-slate)]/60" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 py-6 bg-[var(--wealth-light-gray)]/20 border-[var(--wealth-light-gray)]" 
                    {...field} 
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 text-[var(--wealth-slate)]/60 hover:text-[var(--wealth-teal)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full mt-6 py-6 bg-[var(--wealth-teal)] hover:bg-[var(--wealth-dark-teal)] text-white" 
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const isPending = registerMutation.isPending;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    // Extract username and password, omitting confirmPassword which isn't in the schema
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--wealth-dark-slate)] font-medium">Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[var(--wealth-slate)]/60" />
                  <Input 
                    placeholder="Choose a username" 
                    className="pl-10 py-6 bg-[var(--wealth-light-gray)]/20 border-[var(--wealth-light-gray)]" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--wealth-dark-slate)] font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--wealth-slate)]/60" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 py-6 bg-[var(--wealth-light-gray)]/20 border-[var(--wealth-light-gray)]" 
                    {...field} 
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 text-[var(--wealth-slate)]/60 hover:text-[var(--wealth-teal)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--wealth-dark-slate)] font-medium">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--wealth-slate)]/60" />
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 py-6 bg-[var(--wealth-light-gray)]/20 border-[var(--wealth-light-gray)]" 
                    {...field} 
                  />
                  <button 
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-3 text-[var(--wealth-slate)]/60 hover:text-[var(--wealth-teal)]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full mt-6 py-6 bg-[var(--wealth-teal)] hover:bg-[var(--wealth-dark-teal)] text-white" 
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}