import { MockStorage } from './utils/mockStorage';

describe('MockStorage', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('User methods', () => {
    it('should create a user and retrieve it by ID', async () => {
      const insertUser = {
        username: 'testuser',
        password: 'hashedpassword'
      };

      const createdUser = await storage.createUser(insertUser);
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.username).toBe(insertUser.username);

      const retrievedUser = await storage.getUser(createdUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.username).toBe(createdUser.username);
    });

    it('should retrieve a user by username', async () => {
      const insertUser = {
        username: 'testuser',
        password: 'hashedpassword'
      };

      await storage.createUser(insertUser);
      const user = await storage.getUserByUsername(insertUser.username);
      
      expect(user).toBeDefined();
      expect(user?.username).toBe(insertUser.username);
    });

    it('should return undefined for non-existent users', async () => {
      const user = await storage.getUser(999);
      expect(user).toBeUndefined();

      const userByUsername = await storage.getUserByUsername('nonexistent');
      expect(userByUsername).toBeUndefined();
    });
  });

  describe('Reset method', () => {
    it('should clear all data', async () => {
      // Add some data
      await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword'
      });

      // Reset
      storage.reset();

      // Verify data is cleared
      const user = await storage.getUserByUsername('testuser');
      expect(user).toBeUndefined();
    });
  });
});