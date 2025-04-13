import { 
  users, type User, type InsertUser,
  institutions, type Institution, type InsertInstitution,
  accounts, type Account, type InsertAccount,
  transactions, type Transaction, type InsertTransaction,
  netWorthHistory, type NetWorthHistory, type InsertNetWorthHistory,
  plaidLinkTokens, type PlaidLinkToken, type InsertPlaidLinkToken
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private institutions: Map<number, Institution>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private netWorthHistories: Map<number, NetWorthHistory>;
  private plaidLinkTokens: Map<number, PlaidLinkToken>;
  
  private currentUserId: number;
  private currentInstitutionId: number;
  private currentAccountId: number;
  private currentTransactionId: number;
  private currentNetWorthHistoryId: number;
  private currentPlaidLinkTokenId: number;

  constructor() {
    this.users = new Map();
    this.institutions = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.netWorthHistories = new Map();
    this.plaidLinkTokens = new Map();
    
    this.currentUserId = 1;
    this.currentInstitutionId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentNetWorthHistoryId = 1;
    this.currentPlaidLinkTokenId = 1;

    // Create a default user for testing
    this.createUser({
      username: "demo",
      password: "password"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Institution methods
  async getInstitution(id: number): Promise<Institution | undefined> {
    return this.institutions.get(id);
  }

  async getInstitutionsByUserId(userId: number): Promise<Institution[]> {
    return Array.from(this.institutions.values()).filter(
      (institution) => institution.userId === userId,
    );
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const id = this.currentInstitutionId++;
    const institution: Institution = { 
      ...insertInstitution, 
      id, 
      lastUpdated: new Date() 
    };
    this.institutions.set(id, institution);
    return institution;
  }

  async updateInstitution(id: number, institutionUpdate: Partial<Institution>): Promise<Institution | undefined> {
    const institution = this.institutions.get(id);
    if (!institution) return undefined;

    const updatedInstitution: Institution = { 
      ...institution, 
      ...institutionUpdate,
      lastUpdated: new Date()
    };
    this.institutions.set(id, updatedInstitution);
    return updatedInstitution;
  }

  async deleteInstitution(id: number): Promise<boolean> {
    return this.institutions.delete(id);
  }

  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async getAccountsByInstitutionId(institutionId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.institutionId === institutionId,
    );
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = { 
      ...insertAccount, 
      id, 
      lastUpdated: new Date()
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount: Account = { 
      ...account, 
      ...accountUpdate,
      lastUpdated: new Date()
    };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  async getTransactionsByAccountId(accountId: number, limit?: number): Promise<Transaction[]> {
    const accountTransactions = Array.from(this.transactions.values())
      .filter((transaction) => transaction.accountId === accountId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return limit ? accountTransactions.slice(0, limit) : accountTransactions;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { ...insertTransaction, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async createTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const createdTransactions: Transaction[] = [];
    
    for (const insertTransaction of insertTransactions) {
      const transaction = await this.createTransaction(insertTransaction);
      createdTransactions.push(transaction);
    }
    
    return createdTransactions;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction: Transaction = { 
      ...transaction, 
      ...transactionUpdate
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // NetWorth history methods
  async getNetWorthHistory(id: number): Promise<NetWorthHistory | undefined> {
    return this.netWorthHistories.get(id);
  }

  async getNetWorthHistoryByUserId(userId: number, limit?: number): Promise<NetWorthHistory[]> {
    const netWorthHistories = Array.from(this.netWorthHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return limit ? netWorthHistories.slice(0, limit) : netWorthHistories;
  }

  async createNetWorthHistory(insertNetWorthHistory: InsertNetWorthHistory): Promise<NetWorthHistory> {
    const id = this.currentNetWorthHistoryId++;
    const netWorthHistory: NetWorthHistory = { ...insertNetWorthHistory, id };
    this.netWorthHistories.set(id, netWorthHistory);
    return netWorthHistory;
  }

  // Plaid Link Token methods
  async createPlaidLinkToken(insertLinkToken: InsertPlaidLinkToken): Promise<PlaidLinkToken> {
    const id = this.currentPlaidLinkTokenId++;
    const linkToken: PlaidLinkToken = { 
      ...insertLinkToken, 
      id, 
      createdAt: new Date() 
    };
    this.plaidLinkTokens.set(id, linkToken);
    return linkToken;
  }

  async getLatestPlaidLinkToken(userId: number): Promise<PlaidLinkToken | undefined> {
    const userTokens = Array.from(this.plaidLinkTokens.values())
      .filter((token) => token.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return userTokens.length > 0 ? userTokens[0] : undefined;
  }
}

export const storage = new MemStorage();
