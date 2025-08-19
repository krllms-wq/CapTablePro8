import { storage } from "../../storage";
import { logEvent } from "../activity/logEvent";
import type { Stakeholder, SecurityClass } from "@shared/schema";
import { toDateOnlyUTC, addDaysUTC } from "@shared/utils/dateUtils";

// Inline rich demo data creation to avoid schema mismatches
async function createRichDemoData({
  storage,
  companyId,
  alice,
  bob,
  jane,
  demoVentures,
  commonStock,
  incorporationDate
}: {
  storage: any;
  companyId: string;
  alice: Stakeholder;
  bob: Stakeholder;
  jane: Stakeholder;
  demoVentures: Stakeholder;
  commonStock: SecurityClass;
  incorporationDate: Date;
}) {
  const incorporationDateStr = toDateOnlyUTC(incorporationDate);
  const optionsGrantDate = addDaysUTC(incorporationDateStr, 60); // 2 months after incorporation
  const safeDate = addDaysUTC(incorporationDateStr, 90); // 3 months after incorporation
  
  console.log('Creating equity awards...');
  
  // Jane's Stock Options: 200,000 options, $1.00 strike, 4y vest, 1y cliff
  await storage.createEquityAward({
    companyId,
    holderId: jane.id,
    type: 'ISO',
    quantityGranted: 200000,
    strikePrice: '1.00',
    grantDate: optionsGrantDate,
    vestingStartDate: optionsGrantDate,
    cliffMonths: 12,
    totalMonths: 48,
    quantityExercised: 0,
    quantityCanceled: 0
  });

  // Jane's RSUs: 50,000 RSUs
  await storage.createEquityAward({
    companyId,
    holderId: jane.id,
    type: 'RSU',
    quantityGranted: 50000,
    strikePrice: null,
    grantDate: optionsGrantDate,
    vestingStartDate: optionsGrantDate,
    cliffMonths: 0,
    totalMonths: 36,
    quantityExercised: 0,
    quantityCanceled: 0
  });
  
  console.log('Creating convertible instruments...');

  // SAFE: $250,000, $10M cap, 20% discount
  await storage.createConvertibleInstrument({
    companyId,
    holderId: demoVentures.id,
    type: 'safe',
    framework: 'YC pre-money SAFE',
    principal: '250000.00',
    interestRate: '0.00',
    discountRate: '0.20',
    valuationCap: '10000000.00',
    issueDate: safeDate,
    postMoney: false
  });
  
  console.log('Rich demo data creation completed');
}

export async function seedExampleCompany({ userId }: { userId: string }): Promise<{ companyId: string }> {
  // Check if user already has a demo company
  const companies = await storage.getCompanies();
  const existingDemo = companies.find(c => c.ownerId === userId && c.isDemo);

  if (existingDemo) {
    return { companyId: existingDemo.id };
  }

  try {
    const now = new Date();
    const incorporationDate = new Date(now.getTime() - (18 * 30 * 24 * 60 * 60 * 1000)); // 18 months ago
    
    // 1. Create Example LLC
    const company = await storage.createCompany({
      name: "Example LLC",
      description: "A sample company to explore cap table features",
      jurisdiction: "Delaware",
      country: "US",
      incorporationDate: toDateOnlyUTC(incorporationDate),
      authorizedShares: 10000000,
      isDemo: true,
      ownerId: userId,
    });

    const companyId = company.id;

    // Log company creation
    await logEvent({
      companyId,
      actorId: userId,
      event: "company.created",
      resourceType: "company",
      resourceId: companyId,
      metadata: { 
        isDemo: true,
        name: "Example LLC",
        jurisdiction: "Delaware"
      }
    });

    // 2. Create Security Classes
    const commonStock = await storage.createSecurityClass({
      companyId,
      name: "Common Stock",
      seniorityTier: 0,
      liquidationPreferenceMultiple: "1.0",
      convertToCommonRatio: "1.0",
      votingRights: "1.0",
    });

    const preferredSeed = await storage.createSecurityClass({
      companyId,
      name: "Preferred Seed",
      seniorityTier: 1,
      liquidationPreferenceMultiple: "1.0",
      convertToCommonRatio: "1.0",
      votingRights: "1.0",
    });

    // 3. Create Stakeholders
    const aliceFounder = await storage.createStakeholder({
      companyId,
      type: "person",
      name: "Alice Founder",
      email: "alice@example-llc.com",
      title: "CEO & Co-Founder",
    });

    const bobFounder = await storage.createStakeholder({
      companyId,
      type: "person", 
      name: "Bob Founder",
      email: "bob@example-llc.com",
      title: "CTO & Co-Founder",
    });

    const janeEmployee = await storage.createStakeholder({
      companyId,
      type: "person",
      name: "Jane Employee", 
      email: "jane@example-llc.com",
      title: "Senior Engineer",
    });

    const demoVentures = await storage.createStakeholder({
      companyId,
      type: "entity",
      name: "Demo Ventures",
      email: "contact@demoventures.com",
      title: "Investment Fund",
    });

    // Log stakeholder creations
    for (const stakeholder of [aliceFounder, bobFounder, janeEmployee, demoVentures]) {
      await logEvent({
        companyId,
        actorId: userId,
        event: "stakeholder.created",
        resourceType: "stakeholder",
        resourceId: stakeholder.id,
        metadata: { name: stakeholder.name }
      });
    }

    // 4. Issue Initial Shares
    const incorporationDateStr = toDateOnlyUTC(incorporationDate);
    const aliceSharesDate = addDaysUTC(incorporationDateStr, 7); // 1 week after incorporation
    await storage.createShareLedgerEntry({
      companyId,
      holderId: aliceFounder.id,
      classId: commonStock.id,
      quantity: 3000000,
      issueDate: aliceSharesDate,
      certificateNo: "CS-001",
      consideration: 30000.00,
      considerationType: "cash",
    });

    const bobSharesDate = addDaysUTC(incorporationDateStr, 14); // 2 weeks after incorporation
    await storage.createShareLedgerEntry({
      companyId,
      holderId: bobFounder.id,
      classId: commonStock.id,
      quantity: 2000000,
      issueDate: bobSharesDate,
      certificateNo: "CS-002", 
      consideration: 20000.00,
      considerationType: "cash",
    });

    // Add rich demo transactions automatically for comprehensive demo data
    try {
      console.log('🌱 Seeding comprehensive demo transactions...');
      
      // Get existing stakeholders and security classes
      const stakeholders = await storage.getStakeholders(companyId);
      const securityClasses = await storage.getSecurityClasses(companyId);
      
      const alice = stakeholders.find(s => s.name === "Alice Founder");
      const bob = stakeholders.find(s => s.name === "Bob Founder");
      const jane = stakeholders.find(s => s.name === "Jane Employee");
      const demoVentures = stakeholders.find(s => s.name === "Demo Ventures");
      const commonStock = securityClasses.find(c => c.name === "Common Stock");
      
      if (alice && bob && jane && demoVentures && commonStock) {
        // Create rich demo transactions directly here with proper schema
        await createRichDemoData({
          storage,
          companyId,
          alice,
          bob,
          jane,
          demoVentures,
          commonStock,
          incorporationDate: incorporationDate
        });
        console.log('✅ Rich demo transactions added successfully');
      }
    } catch (error) {
      console.error('Warning: Failed to add rich demo transactions:', error);
      // Continue without failing the whole seeding process
    }

    // Log final seeding completion
    await logEvent({
      companyId,
      actorId: userId,
      event: "demo.seeded",
      resourceType: "company", 
      resourceId: companyId,
      metadata: {
        stakeholders: 4,
        shareIssuances: 2,
        securityClasses: 2,
      }
    });

    return { companyId };
  } catch (error) {
    console.error("Error seeding example company:", error);
    throw error;
  }
}