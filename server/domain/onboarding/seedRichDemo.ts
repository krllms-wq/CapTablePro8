import { randomUUID } from "crypto";
import type { IStorage } from "../../storage";
import type {
  Company, SecurityClass, Stakeholder, ShareLedgerEntry, EquityAward,
  ConvertibleInstrument, CorporateAction, Round
} from "@shared/schema";

/**
 * Seeds rich transaction data for the demo company "Example LLC"
 * Includes: shares, options, RSUs, SAFEs, convertible notes, secondary sales, stock splits, and priced rounds
 */
export async function seedRichDemoTransactions(storage: IStorage, companyId: string): Promise<void> {
  console.log('=== SEEDING RICH DEMO TRANSACTIONS ===');
  
  try {
    // Get existing company and stakeholders
    const company = await storage.getCompany(companyId);
    if (!company) {
      throw new Error('Demo company not found');
    }
    
    const stakeholders = await storage.getStakeholders(companyId);
    const alice = stakeholders.find(s => s.name === 'Alice Founder');
    const bob = stakeholders.find(s => s.name === 'Bob Founder');
    
    if (!alice || !bob) {
      throw new Error('Demo founders not found');
    }

    // Create additional stakeholders
    const jane = await storage.createStakeholder({
      companyId,
      name: 'Jane Employee',
      type: 'employee',
      email: 'jane@example.com',
      address: '789 Oak St, San Francisco, CA 94105'
    });

    const demoVentures = await storage.createStakeholder({
      companyId,
      name: 'Demo Ventures',
      type: 'investor',
      email: 'invest@demoventures.com',
      address: '456 Venture Blvd, Palo Alto, CA 94301'
    });

    // Create preferred security class for funding round
    const preferredSeed = await storage.createSecurityClass({
      companyId,
      name: 'Preferred Seed',
      seniorityTier: 1,
      liquidationPreferenceMultiple: '1.0',
      participating: false,
      participationCap: null,
      dividendRate: '8.0',
      dividendType: 'cumulative',
      convertToCommonRatio: '1.0',
      votingRights: 'full'
    });

    // Calculate key dates
    const now = new Date();
    const incorporationDate = new Date('2024-01-01');
    const optionsGrantDate = new Date(incorporationDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +1 month
    const stockSplitDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // -6 months
    const prizedRoundDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // -3 months
    const secondaryDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // -2 months
    const safeDate = new Date(now.getTime() - 270 * 24 * 60 * 60 * 1000); // -9 months
    const convertibleDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // -12 months
    const maturityDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +12 months

    // Get common stock security class
    const securityClasses = await storage.getSecurityClasses(companyId);
    const commonStock = securityClasses.find(sc => sc.name === 'Common Stock');
    if (!commonStock) {
      throw new Error('Common Stock security class not found');
    }

    console.log('Creating equity awards...');
    
    // Jane's Stock Options: 200,000 options, $1.00 strike, 4y vest, 1y cliff
    await storage.createEquityAward({
      companyId,
      holderId: jane.id,
      securityClassId: commonStock.id,
      type: 'stock_option',
      quantityGranted: 200000,
      strikePrice: 1.00,
      grantDate: optionsGrantDate,
      vestingScheduleType: 'time_based',
      vestingStartDate: optionsGrantDate,
      vestingDurationMonths: 48, // 4 years
      cliffMonths: 12, // 1 year cliff
      quantityExercised: 0,
      quantityCancelled: 0,
      expirationDate: new Date(optionsGrantDate.getTime() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years
    });

    // Jane's RSUs: 50,000 RSUs, no strike, 3y vest, no cliff
    await storage.createEquityAward({
      companyId,
      holderId: jane.id,
      securityClassId: commonStock.id,
      type: 'rsu',
      quantityGranted: 50000,
      strikePrice: 0.00,
      grantDate: optionsGrantDate,
      vestingScheduleType: 'time_based',
      vestingStartDate: optionsGrantDate,
      vestingDurationMonths: 36, // 3 years
      cliffMonths: 0, // no cliff
      quantityExercised: 0,
      quantityCancelled: 0,
      expirationDate: new Date(optionsGrantDate.getTime() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
    });

    console.log('Creating convertible instruments...');

    // SAFE: $250,000, $10M cap, 20% discount
    await storage.createConvertibleInstrument({
      companyId,
      holderId: demoVentures.id,
      type: 'safe',
      principal: 250000.00,
      interestRate: 0.00, // SAFEs typically don't have interest
      discount: 20.00, // 20% discount
      valuationCap: 10000000.00,
      issueDate: safeDate,
      maturityDate: undefined, // SAFEs typically don't have maturity
      conversionTriggers: ['equity_financing', 'liquidity_event'],
      status: 'outstanding'
    });

    // Convertible Note: $100,000, 8% interest, 20% discount, $12M cap
    await storage.createConvertibleInstrument({
      companyId,
      holderId: demoVentures.id,
      type: 'convertible_note',
      principal: 100000.00,
      interestRate: 8.00,
      discount: 20.00,
      valuationCap: 12000000.00,
      issueDate: convertibleDate,
      maturityDate: maturityDate,
      conversionTriggers: ['equity_financing', 'maturity', 'liquidity_event'],
      status: 'outstanding'
    });

    console.log('Creating corporate actions...');

    // Stock Split: 2:1 split
    await storage.createCorporateAction({
      companyId,
      type: 'stock_split',
      effectiveDate: stockSplitDate,
      ratio: '2:1',
      affectedClasses: [commonStock.id]
    });

    console.log('Creating funding round...');

    // Seed Round: $2M investment, $8M pre-money, 15% option pool top-up
    const seedRound = await storage.createRound({
      companyId,
      name: 'Seed Round',
      roundType: 'seed',
      status: 'closed',
      raiseAmount: '2000000.00',
      preMoneyValuation: '8000000.00',
      closeDate: prizedRoundDate
    });

    // Issue Preferred Seed shares to Demo Ventures
    // $2M investment at $10M post-money = 20% ownership = 2M shares out of 10M total
    await storage.createShareLedgerEntry({
      companyId,
      holderId: demoVentures.id,
      classId: preferredSeed.id,
      quantity: 2000000,
      issueDate: prizedRoundDate,
      certificateNo: 'PS-001',
      consideration: 2000000.00,
      considerationType: 'cash',
      sourceTransactionId: seedRound.id
    });

    console.log('Creating secondary transaction...');

    // Secondary sale: Alice sells 50,000 shares to Demo Ventures at $2.50/share
    await storage.createShareLedgerEntry({
      companyId,
      holderId: demoVentures.id,
      classId: commonStock.id,
      quantity: 50000,
      issueDate: secondaryDate,
      certificateNo: 'CS-003',
      consideration: 125000.00, // 50,000 × $2.50
      considerationType: 'cash',
      sourceTransactionId: null
    });

    // Create corresponding negative entry for Alice (shares sold)
    await storage.createShareLedgerEntry({
      companyId,
      holderId: alice.id,
      classId: commonStock.id,
      quantity: -50000, // Negative for shares sold
      issueDate: secondaryDate,
      certificateNo: 'CS-003-TRANSFER',
      consideration: 125000.00,
      considerationType: 'cash',
      sourceTransactionId: null
    });

    console.log('✅ Rich demo transactions seeded successfully');
    console.log(`- Options granted: 200,000 to ${jane.name}`);
    console.log(`- RSUs granted: 50,000 to ${jane.name}`);
    console.log(`- SAFE issued: $250,000 to ${demoVentures.name}`);
    console.log(`- Convertible note issued: $100,000 to ${demoVentures.name}`);
    console.log(`- Stock split: 2:1 executed`);
    console.log(`- Seed round: $2M raised from ${demoVentures.name}`);
    console.log(`- Secondary sale: 50,000 shares Alice → ${demoVentures.name}`);

  } catch (error) {
    console.error('ERROR seeding rich demo transactions:', error);
    throw error;
  }
}