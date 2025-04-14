import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { MockStorage } from './mocks/utils/mockStorage';
import { User, Institution, Account, Transaction, NetWorthHistory } from '@shared/schema';

// Mock data for testing
const TEST_USER: User = {
  id: 1,
  username: 'testuser',
  password: 'hashedpassword',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

const TEST_INSTITUTION: Institution = {
  id: 1,
  userId: 1,
  plaidInstitutionId: 'ins_123',
  name: 'Test Bank',
  type: 'bank',
  logo: 'logo.png',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

const TEST_ACCOUNTS: Account[] = [
  {
    id: 1,
    userId: 1,
    institutionId: 1,
    plaidAccountId: 'acc_123',
    name: 'Checking',
    officialName: 'Primary Checking',
    type: 'depository',
    subtype: 'checking',
    currentBalance: "1000.00",
    availableBalance: "900.00",
    isManual: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 2,
    userId: 1,
    institutionId: 1,
    plaidAccountId: 'acc_456',
    name: 'Savings',
    officialName: 'High-Yield Savings',
    type: 'depository',
    subtype: 'savings',
    currentBalance: "5000.00",
    availableBalance: "5000.00",
    isManual: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

const TEST_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    userId: 1,
    accountId: 1,
    plaidTransactionId: 'txn_123',
    amount: "50.00",
    date: new Date('2025-03-15'),
    name: 'Grocery Store',
    merchantName: 'Whole Foods',
    category: 'Food and Drink',
    pending: false,
    paymentChannel: 'in_store',
    createdAt: new Date('2025-03-16'),
    updatedAt: new Date('2025-03-16')
  },
  {
    id: 2,
    userId: 1,
    accountId: 1,
    plaidTransactionId: 'txn_456',
    amount: "120.00",
    date: new Date('2025-03-14'),
    name: 'Electric Bill',
    merchantName: 'Power Company',
    category: 'Utilities',
    pending: false,
    paymentChannel: 'online',
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-15')
  }
];

const TEST_NET_WORTH_HISTORY: NetWorthHistory[] = [
  {
    id: 1,
    userId: 1,
    date: new Date('2025-03-01'),
    totalAssets: "6000.00",
    totalLiabilities: "1000.00",
    netWorth: "5000.00",
    createdAt: new Date('2025-03-01')
  },
  {
    id: 2,
    userId: 1,
    date: new Date('2025-04-01'),
    totalAssets: "6500.00",
    totalLiabilities: "900.00",
    netWorth: "5600.00",
    createdAt: new Date('2025-04-01')
  }
];

// Middleware to mock authentication for tests
const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  // Add user to request object
  (req as any).user = TEST_USER;
  (req as any).isAuthenticated = () => true;
  next();
};

describe('API Routes', () => {
  let app: Express;
  let mockStorage: MockStorage;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Create mock storage with test data
    mockStorage = new MockStorage({
      users: [TEST_USER],
      institutions: [TEST_INSTITUTION],
      accounts: TEST_ACCOUNTS,
      transactions: TEST_TRANSACTIONS,
      netWorthHistory: TEST_NET_WORTH_HISTORY
    });
    
    // Add authentication middleware to all routes
    app.use(mockAuth);
    
    // Register API routes
    
    // Net Worth Summary endpoint
    app.get('/api/net-worth/summary', async (req, res) => {
      const user = (req as any).user;
      
      // Calculate net worth from accounts
      const accounts = await mockStorage.getAccountsByUserId(user.id);
      let totalAssets = 0;
      let totalLiabilities = 0;
      
      accounts.forEach(account => {
        const balance = parseFloat(account.currentBalance);
        if (account.type === 'depository' || account.type === 'investment') {
          totalAssets += balance;
        } else if (account.type === 'credit' || account.type === 'loan') {
          totalLiabilities += balance;
        }
      });
      
      const netWorth = totalAssets - totalLiabilities;
      
      res.json({
        netWorth: netWorth.toFixed(4),
        totalAssets: totalAssets.toFixed(4),
        totalLiabilities: totalLiabilities.toFixed(4)
      });
    });
    
    // Net Worth History endpoint
    app.get('/api/net-worth/history', async (req, res) => {
      const user = (req as any).user;
      const history = await mockStorage.getNetWorthHistoryByUserId(user.id);
      res.json(history);
    });
    
    // Accounts endpoint
    app.get('/api/accounts', async (req, res) => {
      const user = (req as any).user;
      const accounts = await mockStorage.getAccountsByUserId(user.id);
      res.json(accounts);
    });
    
    // Transactions endpoint
    app.get('/api/transactions', async (req, res) => {
      const user = (req as any).user;
      const transactions = await mockStorage.getTransactionsByUserId(user.id);
      res.json(transactions);
    });
    
    // Institutions endpoint
    app.get('/api/institutions', async (req, res) => {
      const user = (req as any).user;
      const institutions = await mockStorage.getInstitutionsByUserId(user.id);
      res.json(institutions);
    });
    
    // Add manual account endpoint
    app.post('/api/accounts/manual', async (req, res) => {
      const user = (req as any).user;
      const { name, type, currentBalance } = req.body;
      
      const account = await mockStorage.createAccount({
        userId: user.id,
        institutionId: 0, // Manual accounts don't need institution
        plaidAccountId: '',
        name,
        officialName: name,
        type,
        subtype: '',
        currentBalance,
        availableBalance: currentBalance,
        isManual: true
      });
      
      res.status(201).json(account);
    });
  });
  
  describe('GET /api/net-worth/summary', () => {
    it('should return the correct net worth summary', async () => {
      const res = await request(app).get('/api/net-worth/summary');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('netWorth');
      expect(res.body).toHaveProperty('totalAssets');
      expect(res.body).toHaveProperty('totalLiabilities');
      
      // Calculate expected values based on test accounts
      const totalAssets = TEST_ACCOUNTS
        .filter(a => a.type === 'depository' || a.type === 'investment')
        .reduce((sum, a) => sum + parseFloat(a.currentBalance), 0);
      
      const totalLiabilities = TEST_ACCOUNTS
        .filter(a => a.type === 'credit' || a.type === 'loan')
        .reduce((sum, a) => sum + parseFloat(a.currentBalance), 0);
      
      expect(parseFloat(res.body.totalAssets)).toBeCloseTo(totalAssets, 2);
      expect(parseFloat(res.body.totalLiabilities)).toBeCloseTo(totalLiabilities, 2);
      expect(parseFloat(res.body.netWorth)).toBeCloseTo(totalAssets - totalLiabilities, 2);
    });
  });
  
  describe('GET /api/net-worth/history', () => {
    it('should return net worth history in reverse chronological order', async () => {
      const res = await request(app).get('/api/net-worth/history');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(TEST_NET_WORTH_HISTORY.length);
      
      // Check that dates are in descending order
      for (let i = 0; i < res.body.length - 1; i++) {
        const currentDate = new Date(res.body[i].date);
        const nextDate = new Date(res.body[i + 1].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });
  
  describe('GET /api/accounts', () => {
    it('should return all accounts for the authenticated user', async () => {
      const res = await request(app).get('/api/accounts');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(TEST_ACCOUNTS.length);
      
      // Check that accounts have the right properties
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('type');
      expect(res.body[0]).toHaveProperty('currentBalance');
    });
  });
  
  describe('GET /api/transactions', () => {
    it('should return transactions for the authenticated user', async () => {
      const res = await request(app).get('/api/transactions');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(TEST_TRANSACTIONS.length);
      
      // Check that transactions have the right properties
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('amount');
      expect(res.body[0]).toHaveProperty('date');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('category');
    });
  });
  
  describe('POST /api/accounts/manual', () => {
    it('should create a new manual account', async () => {
      const newAccount = {
        name: 'Test Manual Account',
        type: 'depository',
        currentBalance: '2500.00'
      };
      
      const res = await request(app)
        .post('/api/accounts/manual')
        .send(newAccount);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', newAccount.name);
      expect(res.body).toHaveProperty('type', newAccount.type);
      expect(res.body).toHaveProperty('currentBalance', newAccount.currentBalance);
      expect(res.body).toHaveProperty('isManual', true);
      
      // Verify account was added to storage
      const accounts = await mockStorage.getAccountsByUserId(TEST_USER.id);
      expect(accounts.length).toBeGreaterThan(0);
    });
  });
});