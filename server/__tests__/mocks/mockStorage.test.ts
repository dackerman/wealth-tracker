import { MockStorage } from './mockStorage';
import { InsertUser } from '@shared/schema';

describe('MockStorage', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('User methods', () => {
    it('should create and retrieve a user', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'password123'
      };
      
      const createdUser = await mockStorage.createUser(userData);
      expect(createdUser.id).toBe(1);
      expect(createdUser.username).toBe('testuser');
      
      const retrievedUser = await mockStorage.getUser(1);
      expect(retrievedUser).toEqual(createdUser);
      
      const retrievedByUsername = await mockStorage.getUserByUsername('testuser');
      expect(retrievedByUsername).toEqual(createdUser);
    });
  });

  describe('Institution methods', () => {
    it('should create, retrieve, update and delete institutions', async () => {
      // Create user first
      const user = await mockStorage.createUser({
        username: 'testuser',
        password: 'password123'
      });
      
      // Create institution
      const createdInstitution = await mockStorage.createInstitution({
        userId: user.id,
        plaidInstitutionId: 'ins_123',
        name: 'Test Bank',
        color: '#123456',
        logo: 'logo.png'
      });
      expect(createdInstitution.id).toBe(1);
      
      // Get by ID
      const retrievedInstitution = await mockStorage.getInstitution(1);
      expect(retrievedInstitution).toEqual(createdInstitution);
      
      // Get by user ID
      const userInstitutions = await mockStorage.getInstitutionsByUserId(user.id);
      expect(userInstitutions.length).toBe(1);
      expect(userInstitutions[0]).toEqual(createdInstitution);
      
      // Update
      const updatedInstitution = await mockStorage.updateInstitution(1, { name: 'Updated Bank' });
      expect(updatedInstitution?.name).toBe('Updated Bank');
      
      // Delete
      const deleted = await mockStorage.deleteInstitution(1);
      expect(deleted).toBe(true);
      
      const emptyInstitutions = await mockStorage.getInstitutionsByUserId(user.id);
      expect(emptyInstitutions.length).toBe(0);
    });
  });
});