import request from 'supertest';
import { app } from '../index';
import { MemoryStorage } from '../storage';

describe('Secondary Transfer Validation', () => {
  let storage: MemoryStorage;
  let companyId: string;
  let sellerId: string;
  let buyerId: string;
  let classId: string;
  let authToken: string;

  beforeEach(async () => {
    storage = new MemoryStorage();
    
    // Create test company
    const company = await storage.createCompany({
      name: 'Test Transfer Company',
      description: 'Testing secondary transfers',
      incorporationDate: '2023-01-01',
      ownerId: 'test-owner-id'
    });
    companyId = company.id;

    // Create stakeholders
    const seller = await storage.createStakeholder({
      companyId,
      name: 'John Seller',
      email: 'seller@example.com',
      type: 'individual'
    });
    sellerId = seller.id;

    const buyer = await storage.createStakeholder({
      companyId,
      name: 'Jane Buyer',
      email: 'buyer@example.com', 
      type: 'individual'
    });
    buyerId = buyer.id;

    // Create security class
    const securityClass = await storage.createSecurityClass({
      companyId,
      name: 'Common Stock',
      liquidationPreferenceMultiple: '1.0',
      participating: false,
      votingRights: '1.0'
    });
    classId = securityClass.id;

    // Issue initial shares to seller (1000 shares)
    await storage.createShareLedgerEntry({
      companyId,
      holderId: sellerId,
      classId,
      quantity: 1000,
      issueDate: '2023-01-01',
      consideration: 1000,
      considerationType: 'cash'
    });

    // Mock auth token
    authToken = 'test-auth-token';
  });

  describe('Share Balance Validation', () => {
    test('should reject transfer when seller has insufficient shares', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId, 
          classId,
          quantity: 2000, // More than the 1000 available
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Insufficient shares for transfer');
      expect(response.body.code).toBe('INSUFFICIENT_SHARES');
      expect(response.body.details.requested).toBe(2000);
      expect(response.body.details.available).toBe(1000);
    });

    test('should allow transfer when seller has sufficient shares', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId, 
          quantity: 500, // Within the 1000 available
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('reductionEntry');
      expect(response.body).toHaveProperty('additionEntry');
    });

    test('should accurately track balance after multiple transfers', async () => {
      // First transfer: 300 shares
      await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 300,
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      // Second transfer: 400 shares (total would be 700, should work)
      const response2 = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 400,
          pricePerShare: '5.00',
          transactionDate: '2023-06-16'
        });
      
      expect(response2.status).toBe(201);

      // Third transfer: 400 shares (total would be 1100, should fail)
      const response3 = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 400,
          pricePerShare: '5.00',
          transactionDate: '2023-06-17'
        });

      expect(response3.status).toBe(400);
      expect(response3.body.code).toBe('INSUFFICIENT_SHARES');
      expect(response3.body.details.available).toBe(300); // 1000 - 300 - 400 = 300
    });
  });

  describe('Cap Table Impact', () => {
    test('should update ownership percentages after secondary transfer', async () => {
      // Get initial cap table
      const initialCapTable = await request(app)
        .get(`/api/companies/${companyId}/cap-table`)
        .expect(200);

      const initialSellerRow = initialCapTable.body.capTable.find((row: any) => row.holderId === sellerId);
      const initialBuyerRow = initialCapTable.body.capTable.find((row: any) => row.holderId === buyerId);

      expect(initialSellerRow.shares).toBe(1000);
      expect(initialBuyerRow).toBeFalsy(); // Buyer has no shares initially

      // Execute transfer: 400 shares
      await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 400,
          pricePerShare: '10.00',
          transactionDate: '2023-06-15'
        });

      // Get updated cap table
      const updatedCapTable = await request(app)
        .get(`/api/companies/${companyId}/cap-table`)
        .expect(200);

      const updatedSellerRow = updatedCapTable.body.capTable.find((row: any) => row.holderId === sellerId);
      const updatedBuyerRow = updatedCapTable.body.capTable.find((row: any) => row.holderId === buyerId);

      expect(updatedSellerRow.shares).toBe(600); // 1000 - 400
      expect(updatedBuyerRow.shares).toBe(400); // 0 + 400

      // Verify ownership percentages sum to 100%
      const totalOwnership = updatedCapTable.body.capTable.reduce((sum: number, row: any) => sum + row.ownership, 0);
      expect(Math.abs(totalOwnership - 100)).toBeLessThan(0.01); // Allow for rounding
    });
  });

  describe('Data Validation', () => {
    test('should reject transfer to non-existent buyer', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId: 'non-existent-buyer-id',
          classId,
          quantity: 100,
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('BUYER_NOT_FOUND');
    });

    test('should reject self-transfer', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId: sellerId, // Same as seller
          classId,
          quantity: 100,
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('SELF_TRANSFER_NOT_ALLOWED');
    });

    test('should reject transfer with invalid security class', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId: 'non-existent-class-id',
          quantity: 100,
          pricePerShare: '5.00',
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('SECURITY_CLASS_NOT_FOUND');
    });
  });
});