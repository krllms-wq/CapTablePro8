import { storage } from "../../storage";
import { logEvent } from "../activity/logEvent";

export async function seedMinimalDemo({ userId }: { userId: string }): Promise<{ companyId: string }> {
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
      incorporationDate,
      authorizedShares: 10000000,
      isDemo: true,
      ownerId: userId,
    });

    const companyId = company.id;

    // 2. Create Security Classes
    const commonStock = await storage.createSecurityClass({
      companyId,
      name: "Common Stock",
      seniorityTier: 0,
      liquidationPreferenceMultiple: "1.0",
      convertToCommonRatio: "1.0",
      votingRights: "1.0",
    });

    // 3. Create Sample Stakeholders  
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

    // 4. Issue Initial Shares
    const aliceSharesDate = new Date(incorporationDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    await storage.createShareLedgerEntry({
      companyId,
      holderId: aliceFounder.id,
      classId: commonStock.id,
      quantity: 3000000,
      issueDate: aliceSharesDate,
      certificateNo: "CS-001",
      consideration: "30000.00",
      considerationType: "cash",
    });

    const bobSharesDate = new Date(incorporationDate.getTime() + (14 * 24 * 60 * 60 * 1000));
    await storage.createShareLedgerEntry({
      companyId,
      holderId: bobFounder.id,
      classId: commonStock.id,
      quantity: 2000000,
      issueDate: bobSharesDate,
      certificateNo: "CS-002", 
      consideration: "20000.00",
      considerationType: "cash",
    });

    // Log completion
    await logEvent({
      companyId,
      actorId: userId,
      event: "demo.seeded",
      resourceType: "company", 
      resourceId: companyId,
      metadata: {
        stakeholders: 2,
        shareIssuances: 2,
        securityClasses: 1,
      }
    });

    return { companyId };
  } catch (error) {
    console.error("Error seeding minimal demo company:", error);
    throw error;
  }
}