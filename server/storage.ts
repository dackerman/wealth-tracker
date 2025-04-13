import { 
  users, type User, type InsertUser,
  institutions, type Institution, type InsertInstitution,
  accounts, type Account, type InsertAccount,
  transactions, type Transaction, type InsertTransaction,
  netWorthHistory, type NetWorthHistory, type InsertNetWorthHistory,
  plaidLinkTokens, type PlaidLinkToken, type InsertPlaidLinkToken
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Institution methods
  getInstitution(id: number): Promise<Institution | undefined>;
  getInstitutionsByUserId(userId: number): Promise<Institution[]>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: number, institution: Partial<Institution>): Promise<Institution | undefined>;
  deleteInstitution(id: number): Promise<boolean>;

  // Account methods
  getAccount(id: number): Promise<Account | undefined>;
  getAccountsByUserId(userId: number): Promise<Account[]>;
  getAccountsByInstitutionId(institutionId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]>;
  getTransactionsByAccountId(accountId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // NetWorth history methods
  getNetWorthHistory(id: number): Promise<NetWorthHistory | undefined>;
  getNetWorthHistoryByUserId(userId: number, limit?: number): Promise<NetWorthHistory[]>;
  createNetWorthHistory(netWorthHistory: InsertNetWorthHistory): Promise<NetWorthHistory>;

  // Plaid Link Token methods
  createPlaidLinkToken(linkToken: InsertPlaidLinkToken): Promise<PlaidLinkToken>;
  getLatestPlaidLinkToken(userId: number): Promise<PlaidLinkToken | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Institution methods
  async getInstitution(id: number): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }

  async getInstitutionsByUserId(userId: number): Promise<Institution[]> {
    return db.select().from(institutions).where(eq(institutions.userId, userId));
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    // Make sure all nullish fields are explicitly set to null rather than undefined
    const institutionData = {
      ...insertInstitution,
      logoUrl: insertInstitution.logoUrl ?? null,
      primaryColor: insertInstitution.primaryColor ?? null,
      accessToken: insertInstitution.accessToken ?? null,
      itemId: insertInstitution.itemId ?? null,
      lastUpdated: new Date()
    };
    
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    return institution;
  }

  async updateInstitution(id: number, institutionUpdate: Partial<Institution>): Promise<Institution | undefined> {
    const [updatedInstitution] = await db.update(institutions)
      .set({
        ...institutionUpdate,
        lastUpdated: new Date()
      })
      .where(eq(institutions.id, id))
      .returning();
    return updatedInstitution;
  }

  async deleteInstitution(id: number): Promise<boolean> {
    const result = await db.delete(institutions).where(eq(institutions.id, id));
    return !!result.rowCount;
  }

  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccountsByInstitutionId(institutionId: number): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.institutionId, institutionId));
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    // Make sure all nullish fields are explicitly set to null rather than undefined
    const accountData = {
      ...insertAccount,
      officialName: insertAccount.officialName ?? null,
      subtype: insertAccount.subtype ?? null,
      mask: insertAccount.mask ?? null,
      availableBalance: insertAccount.availableBalance ?? null,
      limit: insertAccount.limit ?? null,
      isoCurrencyCode: insertAccount.isoCurrencyCode ?? null,
      lastUpdated: new Date()
    };
    
    const [account] = await db.insert(accounts).values(accountData).returning();
    return account;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const [updatedAccount] = await db.update(accounts)
      .set({
        ...accountUpdate,
        lastUpdated: new Date()
      })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return !!result.rowCount;
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]> {
    // Get all records first
    const allTransactions = await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
    
    // Apply limit if needed
    if (limit !== undefined) {
      return allTransactions.slice(0, limit);
    }
    return allTransactions;
  }

  async getTransactionsByAccountId(accountId: number, limit?: number): Promise<Transaction[]> {
    // Get all records first
    const allTransactions = await db.select().from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date));
    
    // Apply limit if needed
    if (limit !== undefined) {
      return allTransactions.slice(0, limit);
    }
    return allTransactions;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Make sure all nullish fields are explicitly set to null rather than undefined
    const transactionData = {
      ...insertTransaction,
      merchantName: insertTransaction.merchantName ?? null,
      isoCurrencyCode: insertTransaction.isoCurrencyCode ?? null,
      category: insertTransaction.category ?? null,
      pending: insertTransaction.pending ?? null,
      accountOwner: insertTransaction.accountOwner ?? null,
      paymentChannel: insertTransaction.paymentChannel ?? null
    };
    
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  async createTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    if (insertTransactions.length === 0) {
      return [];
    }
    
    return db.insert(transactions).values(insertTransactions).returning();
  }

  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db.update(transactions)
      .set(transactionUpdate)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return !!result.rowCount;
  }

  // NetWorth history methods
  async getNetWorthHistory(id: number): Promise<NetWorthHistory | undefined> {
    const [history] = await db.select().from(netWorthHistory).where(eq(netWorthHistory.id, id));
    return history;
  }

  async getNetWorthHistoryByUserId(userId: number, limit?: number): Promise<NetWorthHistory[]> {
    // Get all records first
    const allHistory = await db.select().from(netWorthHistory)
      .where(eq(netWorthHistory.userId, userId))
      .orderBy(desc(netWorthHistory.date));
    
    // Apply limit if needed
    if (limit !== undefined) {
      return allHistory.slice(0, limit);
    }
    return allHistory;
  }

  async createNetWorthHistory(insertNetWorthHistory: InsertNetWorthHistory): Promise<NetWorthHistory> {
    // Make sure all required fields are present and nullish fields are explicitly set to null
    const historyData = {
      ...insertNetWorthHistory,
      date: insertNetWorthHistory.date ?? new Date(),
      assetsBreakdown: insertNetWorthHistory.assetsBreakdown ?? null,
      liabilitiesBreakdown: insertNetWorthHistory.liabilitiesBreakdown ?? null
    };
    
    const [history] = await db.insert(netWorthHistory).values(historyData).returning();
    return history;
  }

  // Plaid Link Token methods
  async createPlaidLinkToken(insertLinkToken: InsertPlaidLinkToken): Promise<PlaidLinkToken> {
    const [linkToken] = await db.insert(plaidLinkTokens).values({
      ...insertLinkToken,
      createdAt: new Date()
    }).returning();
    return linkToken;
  }

  async getLatestPlaidLinkToken(userId: number): Promise<PlaidLinkToken | undefined> {
    const [token] = await db.select().from(plaidLinkTokens)
      .where(eq(plaidLinkTokens.userId, userId))
      .orderBy(desc(plaidLinkTokens.createdAt))
      .limit(1);
    
    return token;
  }
}

export const storage = new DatabaseStorage();
