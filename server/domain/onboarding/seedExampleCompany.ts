import { storage } from "../../storage";
import { logEvent } from "../activity/logEvent";

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
      incorporationDate,
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
    const aliceSharesDate = new Date(incorporationDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week after incorporation
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

    const bobSharesDate = new Date(incorporationDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 2 weeks after incorporation
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