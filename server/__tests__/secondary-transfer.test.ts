/**
 * Secondary Transfer Tests
 * Tests atomic transfer functionality with balance validation and new stakeholder creation
 */

import request from 'supertest';
import { app } from '../index';

describe('Secondary Transfer API', () => {
  let authToken: string;
  let companyId: string;
  let sellerId: string;
  let buyerId: string;
  let classId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'hello' });
    
    authToken = loginResponse.body.token;

    // Get company data
    const companiesResponse = await request(app)
      .get('/api/companies')
      .set('Authorization', `Bearer ${authToken}`);
    
    companyId = companiesResponse.body[0].id;

    // Get stakeholders
    const stakeholdersResponse = await request(app)
      .get(`/api/companies/${companyId}/stakeholders`)
      .set('Authorization', `Bearer ${authToken}`);
    
    sellerId = stakeholdersResponse.body[0].id;
    buyerId = stakeholdersResponse.body[1].id;

    // Get security classes
    const classesResponse = await request(app)
      .get(`/api/companies/${companyId}/security-classes`)
      .set('Authorization', `Bearer ${authToken}`);
    
    classId = classesResponse.body[0].id;
  });

  describe('Balance Validation', () => {
    test('should return 400 with INSUFFICIENT_SHARES code when seller has insufficient balance', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 999999999, // Excessive quantity
          pricePerShare: 1.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Insufficient shares for transfer');
      expect(response.body.code).toBe('INSUFFICIENT_SHARES');
      expect(response.body.details).toHaveProperty('requested');
      expect(response.body.details).toHaveProperty('available');
      expect(response.body.details.requested).toBe(999999999);
      expect(typeof response.body.details.available).toBe('number');
    });

    test('should succeed when seller has sufficient balance', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 100, // Small valid quantity
          pricePerShare: 2.50,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('reductionEntry');
      expect(response.body).toHaveProperty('additionEntry');
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body.totalValue).toBe(250); // 100 * 2.50
    });
  });

  describe('New Stakeholder Creation', () => {
    test('should create new stakeholder and execute transfer', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId: 'NEW_STAKEHOLDER',
          classId,
          quantity: 200,
          pricePerShare: 1.75,
          transactionDate: '2023-06-15',
          newBuyer: {
            name: 'New Test Stakeholder',
            email: 'newtest@example.com',
            type: 'individual'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.totalValue).toBe(350); // 200 * 1.75

      // Verify new stakeholder was created
      const stakeholdersResponse = await request(app)
        .get(`/api/companies/${companyId}/stakeholders`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const newStakeholder = stakeholdersResponse.body.find(
        (s: any) => s.name === 'New Test Stakeholder'
      );
      expect(newStakeholder).toBeDefined();
      expect(newStakeholder.email).toBe('newtest@example.com');
      expect(newStakeholder.type).toBe('individual');
    });

    test('should fail when creating new stakeholder without name', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId: 'NEW_STAKEHOLDER',
          classId,
          quantity: 100,
          pricePerShare: 2.00,
          transactionDate: '2023-06-15',
          newBuyer: {
            email: 'incomplete@example.com',
            type: 'individual'
            // Missing name
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('New buyer name is required when creating a new stakeholder');
      expect(response.body.code).toBe('MISSING_BUYER_NAME');
    });

    test('should fail when buyer ID not found and no new buyer data', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId: 'non-existent-id',
          classId,
          quantity: 100,
          pricePerShare: 2.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Buyer stakeholder not found');
      expect(response.body.code).toBe('BUYER_NOT_FOUND');
    });
  });

  describe('Atomic Transaction Properties', () => {
    test('should create both seller reduction and buyer addition entries', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 150,
          pricePerShare: 4.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(201);
      
      // Verify reduction entry
      const reductionEntry = response.body.reductionEntry;
      expect(reductionEntry.holderId).toBe(sellerId);
      expect(reductionEntry.quantity).toBe(-150); // Negative for reduction
      expect(reductionEntry.transactionType).toBe('transfer-out');
      
      // Verify addition entry
      const additionEntry = response.body.additionEntry;
      expect(additionEntry.holderId).toBe(buyerId);
      expect(additionEntry.quantity).toBe(150); // Positive for addition
      expect(additionEntry.transactionType).toBe('transfer-in');
      
      // Verify same transaction ID
      expect(reductionEntry.sourceTransactionId).toBe(additionEntry.sourceTransactionId);
    });

    test('should handle number formatting correctly', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: '1,500', // String with comma
          pricePerShare: '$3.25', // String with dollar sign
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(201);
      expect(response.body.totalValue).toBe(4875); // 1500 * 3.25
    });
  });

  describe('Input Validation', () => {
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          // Missing buyerId, classId, quantity
          pricePerShare: 2.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should fail with zero or negative quantity', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 0,
          pricePerShare: 2.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('positive quantity');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/secondary-transfer`)
        .send({
          sellerId,
          buyerId,
          classId,
          quantity: 100,
          pricePerShare: 2.00,
          transactionDate: '2023-06-15'
        });

      expect(response.status).toBe(401);
    });
  });
});