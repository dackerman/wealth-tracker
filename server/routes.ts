import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getInstitutionInfo,
  getItemInfo,
  getTransactions,
} from "./plaid";
import { insertAccountSchema, insertInstitutionSchema, insertTransactionSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Add userId to body for convenience in route handlers
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    next();
  };

  // Generate a link token for Plaid Link
  app.get("/api/plaid/create-link-token", requireAuth, async (req, res) => {
    try {
      // Get userId from authenticated user
      const userId = req.body.userId.toString();
      
      // Create a link token with Plaid
      const { linkToken, expiration } = await createLinkToken(userId);
      
      // Store the link token in our database
      await storage.createPlaidLinkToken({
        userId: req.body.userId,
        linkToken,
        expiration: new Date(expiration),
      });
      
      res.json({ linkToken });
    } catch (error: any) {
      console.error("Error creating link token:", error);
      res.status(500).json({ error: error.message || "Failed to create link token" });
    }
  });
  
  // Add a manual account
  app.post("/api/accounts/manual", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        institutionName: z.string().min(1),
        accountName: z.string().min(1),
        accountType: z.string().min(1),
        balance: z.number().min(0),
        isLiability: z.boolean().default(false),
      });
      
      const validatedData = schema.parse(req.body);
      const { institutionName, accountName, accountType, balance, isLiability } = validatedData;
      
      // First, check if the institution exists for this user
      const existingInstitutions = await storage.getInstitutionsByUserId(req.body.userId);
      let institution = existingInstitutions.find(i => 
        i.name.toLowerCase() === institutionName.toLowerCase() && !i.plaidInstitutionId
      );
      
      // If not, create a new manual institution
      if (!institution) {
        institution = await storage.createInstitution({
          name: institutionName,
          plaidInstitutionId: '', // Empty for manual institutions
          userId: req.body.userId,
          logoUrl: null,
          primaryColor: null,
          accessToken: null,
          itemId: null,
        });
      }
      
      // Create the account
      const account = await storage.createAccount({
        plaidAccountId: `manual-${Date.now()}`, // Create a unique ID for manual accounts
        institutionId: institution.id,
        userId: req.body.userId,
        name: accountName,
        officialName: null,
        type: accountType,
        subtype: null,
        mask: null,
        currentBalance: isLiability ? -balance.toString() : balance.toString(), // Store as string, negative for liabilities
        availableBalance: isLiability ? -balance.toString() : balance.toString(),
        limit: null,
        isoCurrencyCode: 'USD',
      });
      
      // Calculate and store updated net worth
      await updateNetWorth(req.body.userId);
      
      res.status(201).json({ success: true, account });
    } catch (error: any) {
      console.error("Error adding manual account:", error);
      res.status(500).json({ error: error.message || "Failed to add manual account" });
    }
  });

  // Exchange a public token for an access token
  app.post("/api/plaid/exchange-public-token", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        publicToken: z.string(),
        institutionId: z.string(),
        institutionName: z.string(),
      });
      
      const validatedData = schema.parse(req.body);
      const { publicToken, institutionId, institutionName } = validatedData;
      
      // Exchange the public token for an access token
      const { accessToken, itemId } = await exchangePublicToken(publicToken);
      
      // Get information about the institution
      const institutionInfo = await getInstitutionInfo(institutionId);
      
      // Create the institution in our database
      const institution = await storage.createInstitution({
        plaidInstitutionId: institutionId,
        name: institutionName,
        logoUrl: institutionInfo.logo,
        primaryColor: institutionInfo.primary_color,
        userId: req.body.userId,
        accessToken,
        itemId,
      });
      
      // Get accounts for the institution
      const accountsData = await getAccounts(accessToken);
      
      // Create accounts in our database
      const accountPromises = accountsData.map(async (accountData) => {
        return storage.createAccount({
          plaidAccountId: accountData.account_id,
          institutionId: institution.id,
          userId: req.body.userId,
          name: accountData.name,
          officialName: accountData.official_name || undefined,
          type: accountData.type,
          subtype: accountData.subtype || undefined,
          mask: accountData.mask || undefined,
          currentBalance: accountData.balances.current || 0,
          availableBalance: accountData.balances.available || undefined,
          limit: accountData.balances.limit || undefined,
          isoCurrencyCode: accountData.balances.iso_currency_code || undefined,
        });
      });
      
      const accounts = await Promise.all(accountPromises);
      
      // Get and store initial transactions
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // 30 days ago
      
      const { transactions: transactionsData } = await getTransactions(
        accessToken,
        startDate,
        endDate
      );
      
      // Create transactions in our database
      const transactionPromises = transactionsData.map(async (transactionData) => {
        const account = accounts.find(
          (a) => a.plaidAccountId === transactionData.account_id
        );
        
        if (!account) {
          console.error(`Account ${transactionData.account_id} not found`);
          return null;
        }
        
        return storage.createTransaction({
          plaidTransactionId: transactionData.transaction_id,
          accountId: account.id,
          userId: req.body.userId,
          name: transactionData.name,
          merchantName: transactionData.merchant_name || undefined,
          amount: transactionData.amount,
          isoCurrencyCode: transactionData.iso_currency_code || undefined,
          date: new Date(transactionData.date),
          category: transactionData.category || undefined,
          pending: transactionData.pending || false,
          accountOwner: transactionData.account_owner || undefined,
          paymentChannel: transactionData.payment_channel || undefined,
        });
      });
      
      await Promise.all(transactionPromises.filter(Boolean));
      
      // Calculate and store initial net worth
      await updateNetWorth(req.body.userId);
      
      res.json({ success: true, institution, accounts });
    } catch (error: any) {
      console.error("Error exchanging public token:", error);
      res.status(500).json({ error: error.message || "Failed to exchange public token" });
    }
  });

  // Get all connected institutions for a user
  app.get("/api/institutions", requireAuth, async (req, res) => {
    try {
      const institutions = await storage.getInstitutionsByUserId(req.body.userId);
      res.json(institutions);
    } catch (error: any) {
      console.error("Error getting institutions:", error);
      res.status(500).json({ error: error.message || "Failed to get institutions" });
    }
  });

  // Get all accounts for a user
  app.get("/api/accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.body.userId);
      res.json(accounts);
    } catch (error: any) {
      console.error("Error getting accounts:", error);
      res.status(500).json({ error: error.message || "Failed to get accounts" });
    }
  });

  // Get all accounts for a specific institution
  app.get("/api/institutions/:id/accounts", requireAuth, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id, 10);
      const institution = await storage.getInstitution(institutionId);
      
      if (!institution || institution.userId !== req.body.userId) {
        return res.status(404).json({ error: "Institution not found" });
      }
      
      const accounts = await storage.getAccountsByInstitutionId(institutionId);
      res.json(accounts);
    } catch (error: any) {
      console.error("Error getting accounts for institution:", error);
      res.status(500).json({ error: error.message || "Failed to get accounts for institution" });
    }
  });

  // Get recent transactions for a user
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const transactions = await storage.getTransactionsByUserId(req.body.userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ error: error.message || "Failed to get transactions" });
    }
  });

  // Get transactions for a specific account
  app.get("/api/accounts/:id/transactions", requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id, 10);
      const account = await storage.getAccount(accountId);
      
      if (!account || account.userId !== req.body.userId) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const transactions = await storage.getTransactionsByAccountId(accountId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting transactions for account:", error);
      res.status(500).json({ error: error.message || "Failed to get transactions for account" });
    }
  });

  // Get net worth history for a user
  app.get("/api/net-worth/history", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const period = req.query.period as string || '3M'; // Default to 3 months
      
      const history = await storage.getNetWorthHistoryByUserId(req.body.userId, limit);
      
      // Filter by period if specified
      let filteredHistory = history;
      const now = new Date();
      
      if (period === '1M') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredHistory = history.filter(item => new Date(item.date) >= oneMonthAgo);
      } else if (period === '3M') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        filteredHistory = history.filter(item => new Date(item.date) >= threeMonthsAgo);
      } else if (period === '6M') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        filteredHistory = history.filter(item => new Date(item.date) >= sixMonthsAgo);
      } else if (period === '1Y') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredHistory = history.filter(item => new Date(item.date) >= oneYearAgo);
      }
      
      res.json(filteredHistory);
    } catch (error: any) {
      console.error("Error getting net worth history:", error);
      res.status(500).json({ error: error.message || "Failed to get net worth history" });
    }
  });

  // Get current net worth summary
  app.get("/api/net-worth/summary", requireAuth, async (req, res) => {
    try {
      const history = await storage.getNetWorthHistoryByUserId(req.body.userId, 2);
      
      if (history.length === 0) {
        return res.status(404).json({ error: "No net worth data found" });
      }
      
      const current = history[0];
      const previous = history.length > 1 ? history[1] : null;
      
      const percentChange = previous
        ? ((Number(current.netWorth) - Number(previous.netWorth)) / Number(previous.netWorth)) * 100
        : 0;
      
      res.json({
        netWorth: current.netWorth,
        totalAssets: current.totalAssets,
        totalLiabilities: current.totalLiabilities,
        percentChange: percentChange.toFixed(2),
        assetsBreakdown: current.assetsBreakdown,
        liabilitiesBreakdown: current.liabilitiesBreakdown,
        lastUpdated: current.date,
      });
    } catch (error: any) {
      console.error("Error getting net worth summary:", error);
      res.status(500).json({ error: error.message || "Failed to get net worth summary" });
    }
  });

  // Refresh all financial data
  app.post("/api/refresh", requireAuth, async (req, res) => {
    try {
      const institutions = await storage.getInstitutionsByUserId(req.body.userId);
      
      for (const institution of institutions) {
        if (!institution.accessToken) continue;
        
        // Get updated accounts
        const accountsData = await getAccounts(institution.accessToken);
        
        // Get accounts from our database
        const existingAccounts = await storage.getAccountsByInstitutionId(institution.id);
        
        // Update each account
        for (const accountData of accountsData) {
          const existingAccount = existingAccounts.find(
            (a) => a.plaidAccountId === accountData.account_id
          );
          
          if (existingAccount) {
            await storage.updateAccount(existingAccount.id, {
              currentBalance: accountData.balances.current || 0,
              availableBalance: accountData.balances.available || undefined,
              limit: accountData.balances.limit || undefined,
              lastUpdated: new Date(),
            });
          } else {
            // Create new account if it doesn't exist
            await storage.createAccount({
              plaidAccountId: accountData.account_id,
              institutionId: institution.id,
              userId: req.body.userId,
              name: accountData.name,
              officialName: accountData.official_name || undefined,
              type: accountData.type,
              subtype: accountData.subtype || undefined,
              mask: accountData.mask || undefined,
              currentBalance: accountData.balances.current || 0,
              availableBalance: accountData.balances.available || undefined,
              limit: accountData.balances.limit || undefined,
              isoCurrencyCode: accountData.balances.iso_currency_code || undefined,
            });
          }
        }
        
        // Get and update transactions
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]; // 30 days ago
        
        const { transactions: transactionsData } = await getTransactions(
          institution.accessToken,
          startDate,
          endDate
        );
        
        // Get updated accounts again after updates
        const updatedAccounts = await storage.getAccountsByInstitutionId(institution.id);
        
        // Process transactions
        for (const transactionData of transactionsData) {
          const account = updatedAccounts.find(
            (a) => a.plaidAccountId === transactionData.account_id
          );
          
          if (!account) continue;
          
          // Check if transaction already exists
          const existingTransactions = await storage.getTransactionsByAccountId(account.id);
          const existingTransaction = existingTransactions.find(
            (t) => t.plaidTransactionId === transactionData.transaction_id
          );
          
          if (existingTransaction) {
            // Update existing transaction
            await storage.updateTransaction(existingTransaction.id, {
              name: transactionData.name,
              merchantName: transactionData.merchant_name || undefined,
              amount: transactionData.amount,
              date: new Date(transactionData.date),
              category: transactionData.category || undefined,
              pending: transactionData.pending || false,
            });
          } else {
            // Create new transaction
            await storage.createTransaction({
              plaidTransactionId: transactionData.transaction_id,
              accountId: account.id,
              userId: req.body.userId,
              name: transactionData.name,
              merchantName: transactionData.merchant_name || undefined,
              amount: transactionData.amount,
              isoCurrencyCode: transactionData.iso_currency_code || undefined,
              date: new Date(transactionData.date),
              category: transactionData.category || undefined,
              pending: transactionData.pending || false,
              accountOwner: transactionData.account_owner || undefined,
              paymentChannel: transactionData.payment_channel || undefined,
            });
          }
        }
        
        // Update institution last updated timestamp
        await storage.updateInstitution(institution.id, {
          lastUpdated: new Date(),
        });
      }
      
      // Calculate and store updated net worth
      await updateNetWorth(req.body.userId);
      
      res.json({ success: true, timestamp: new Date() });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ error: error.message || "Failed to refresh data" });
    }
  });

  // Manual account creation endpoint
  app.post("/api/accounts/manual", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        institutionName: z.string(),
        accountName: z.string(),
        accountType: z.string(),
        balance: z.number(),
        isLiability: z.boolean().optional(),
      });
      
      const validatedData = schema.parse(req.body);
      const { institutionName, accountName, accountType, balance, isLiability = false } = validatedData;
      
      // Check if institution already exists (for manual entries)
      let institution = (await storage.getInstitutionsByUserId(req.body.userId))
        .find(i => i.name === institutionName && !i.accessToken);
      
      // Create institution if it doesn't exist
      if (!institution) {
        institution = await storage.createInstitution({
          plaidInstitutionId: `manual-${Date.now()}`,
          name: institutionName,
          logoUrl: undefined,
          primaryColor: undefined,
          userId: req.body.userId,
          accessToken: undefined,
          itemId: undefined,
        });
      }
      
      // Create account
      const account = await storage.createAccount({
        plaidAccountId: `manual-${Date.now()}`,
        institutionId: institution.id,
        userId: req.body.userId,
        name: accountName,
        officialName: undefined,
        type: accountType,
        subtype: 'manual',
        mask: undefined,
        currentBalance: isLiability ? -Math.abs(balance) : balance, // Negative for liabilities
        availableBalance: undefined,
        limit: undefined,
        isoCurrencyCode: 'USD',
      });
      
      // Calculate and store updated net worth
      await updateNetWorth(req.body.userId);
      
      res.json({ success: true, account });
    } catch (error: any) {
      console.error("Error creating manual account:", error);
      res.status(500).json({ error: error.message || "Failed to create manual account" });
    }
  });

  // Helper function to calculate and store net worth
  async function updateNetWorth(userId: number) {
    try {
      const accounts = await storage.getAccountsByUserId(userId);
      
      // Calculate assets and liabilities
      let totalAssets = 0;
      let totalLiabilities = 0;
      
      // Breakdowns
      const assetsBreakdown = {
        cash: 0, // Checking, savings
        investments: 0, // Investment accounts, retirement
        realEstate: 0, // Property
        other: 0, // Other assets
      };
      
      const liabilitiesBreakdown = {
        mortgage: 0,
        creditCards: 0,
        studentLoans: 0,
        other: 0,
      };
      
      accounts.forEach(account => {
        const balance = Number(account.currentBalance);
        
        if (balance >= 0) {
          totalAssets += balance;
          
          // Categorize for breakdown
          if (account.type === 'depository') {
            assetsBreakdown.cash += balance;
          } else if (account.type === 'investment' || account.type === 'retirement') {
            assetsBreakdown.investments += balance;
          } else if (account.type === 'property' || account.subtype === 'real estate') {
            assetsBreakdown.realEstate += balance;
          } else {
            assetsBreakdown.other += balance;
          }
        } else {
          totalLiabilities += Math.abs(balance);
          
          // Categorize for breakdown
          if (account.type === 'loan' && account.subtype === 'mortgage') {
            liabilitiesBreakdown.mortgage += Math.abs(balance);
          } else if (account.type === 'credit') {
            liabilitiesBreakdown.creditCards += Math.abs(balance);
          } else if (account.type === 'loan' && account.subtype === 'student') {
            liabilitiesBreakdown.studentLoans += Math.abs(balance);
          } else {
            liabilitiesBreakdown.other += Math.abs(balance);
          }
        }
      });
      
      const netWorth = totalAssets - totalLiabilities;
      
      // Create net worth history entry
      await storage.createNetWorthHistory({
        userId,
        date: new Date(),
        totalAssets,
        totalLiabilities,
        netWorth,
        assetsBreakdown,
        liabilitiesBreakdown,
      });
      
      return { totalAssets, totalLiabilities, netWorth };
    } catch (error) {
      console.error('Error updating net worth:', error);
      throw error;
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
