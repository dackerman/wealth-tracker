import { IStorage } from '../../storage';
import {
  User,
  InsertUser,
  Institution,
  InsertInstitution,
  Account,
  InsertAccount,
  Transaction,
  InsertTransaction,
  NetWorthHistory,
  InsertNetWorthHistory,
  PlaidLinkToken,
  InsertPlaidLinkToken
} from '@shared/schema';

/**
 * Mock implementation of the IStorage interface for testing
 * This allows us to test server routes without needing a real database
 */
export class MockStorage implements IStorage {
  private users: User[] = [];
  private institutions: Institution[] = [];
  private accounts: Account[] = [];
  private transactions: Transaction[] = [];
  private netWorthHistory: NetWorthHistory[] = [];
  private plaidLinkTokens: PlaidLinkToken[] = [];
  
  private nextIds = {
    user: 1,
    institution: 1,
    account: 1,
    transaction: 1,
    netWorthHistory: 1,
    plaidLinkToken: 1
  };
  
  constructor(initialData?: {
    users?: User[];
    institutions?: Institution[];
    accounts?: Account[];
    transactions?: Transaction[];
    netWorthHistory?: NetWorthHistory[];
    plaidLinkTokens?: PlaidLinkToken[];
  }) {
    if (initialData) {
      this.users = initialData.users || [];
      this.institutions = initialData.institutions || [];
      this.accounts = initialData.accounts || [];
      this.transactions = initialData.transactions || [];
      this.netWorthHistory = initialData.netWorthHistory || [];
      this.plaidLinkTokens = initialData.plaidLinkTokens || [];
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.nextIds.user++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  // Institution methods
  async getInstitution(id: number): Promise<Institution | undefined> {
    return this.institutions.find(institution => institution.id === id);
  }
  
  async getInstitutionsByUserId(userId: number): Promise<Institution[]> {
    return this.institutions.filter(institution => institution.userId === userId);
  }
  
  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const newInstitution: Institution = {
      ...institution,
      id: this.nextIds.institution++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.institutions.push(newInstitution);
    return newInstitution;
  }
  
  async updateInstitution(id: number, institutionUpdate: Partial<Institution>): Promise<Institution | undefined> {
    const index = this.institutions.findIndex(institution => institution.id === id);
    if (index === -1) return undefined;
    
    const updatedInstitution: Institution = {
      ...this.institutions[index],
      ...institutionUpdate,
      updatedAt: new Date()
    };
    
    this.institutions[index] = updatedInstitution;
    return updatedInstitution;
  }
  
  async deleteInstitution(id: number): Promise<boolean> {
    const initialLength = this.institutions.length;
    this.institutions = this.institutions.filter(institution => institution.id !== id);
    return initialLength !== this.institutions.length;
  }
  
  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.find(account => account.id === id);
  }
  
  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return this.accounts.filter(account => account.userId === userId);
  }
  
  async getAccountsByInstitutionId(institutionId: number): Promise<Account[]> {
    return this.accounts.filter(account => account.institutionId === institutionId);
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: this.nextIds.account++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.accounts.push(newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const index = this.accounts.findIndex(account => account.id === id);
    if (index === -1) return undefined;
    
    const updatedAccount: Account = {
      ...this.accounts[index],
      ...accountUpdate,
      updatedAt: new Date()
    };
    
    this.accounts[index] = updatedAccount;
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    const initialLength = this.accounts.length;
    this.accounts = this.accounts.filter(account => account.id !== id);
    return initialLength !== this.accounts.length;
  }
  
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.find(transaction => transaction.id === id);
  }
  
  async getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]> {
    const filtered = this.transactions.filter(transaction => transaction.userId === userId);
    return limit ? filtered.slice(0, limit) : filtered;
  }
  
  async getTransactionsByAccountId(accountId: number, limit?: number): Promise<Transaction[]> {
    const filtered = this.transactions.filter(transaction => transaction.accountId === accountId);
    return limit ? filtered.slice(0, limit) : filtered;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.nextIds.transaction++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }
  
  async createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]> {
    return Promise.all(transactions.map(transaction => this.createTransaction(transaction)));
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const index = this.transactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return undefined;
    
    const updatedTransaction: Transaction = {
      ...this.transactions[index],
      ...transactionUpdate,
      updatedAt: new Date()
    };
    
    this.transactions[index] = updatedTransaction;
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(transaction => transaction.id !== id);
    return initialLength !== this.transactions.length;
  }
  
  // NetWorthHistory methods
  async getNetWorthHistory(id: number): Promise<NetWorthHistory | undefined> {
    return this.netWorthHistory.find(history => history.id === id);
  }
  
  async getNetWorthHistoryByUserId(userId: number, limit?: number): Promise<NetWorthHistory[]> {
    const filtered = this.netWorthHistory.filter(history => history.userId === userId);
    // Sort by date descending to match real database behavior
    const sorted = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  async createNetWorthHistory(netWorthHistory: InsertNetWorthHistory): Promise<NetWorthHistory> {
    const newNetWorthHistory: NetWorthHistory = {
      ...netWorthHistory,
      id: this.nextIds.netWorthHistory++,
      createdAt: new Date()
    };
    this.netWorthHistory.push(newNetWorthHistory);
    return newNetWorthHistory;
  }
  
  // PlaidLinkToken methods
  async createPlaidLinkToken(linkToken: InsertPlaidLinkToken): Promise<PlaidLinkToken> {
    const newLinkToken: PlaidLinkToken = {
      ...linkToken,
      id: this.nextIds.plaidLinkToken++,
      createdAt: new Date()
    };
    this.plaidLinkTokens.push(newLinkToken);
    return newLinkToken;
  }
  
  async getLatestPlaidLinkToken(userId: number): Promise<PlaidLinkToken | undefined> {
    // Sort by createdAt descending and return the first one
    return this.plaidLinkTokens
      .filter(token => token.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
  
  // Method to reset all data for testing purposes
  reset() {
    this.users = [];
    this.institutions = [];
    this.accounts = [];
    this.transactions = [];
    this.netWorthHistory = [];
    this.plaidLinkTokens = [];
    
    this.nextIds = {
      user: 1,
      institution: 1,
      account: 1,
      transaction: 1,
      netWorthHistory: 1,
      plaidLinkToken: 1
    };
  }
}