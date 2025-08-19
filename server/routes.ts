import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { logStakeholderEvent, logTransactionEvent, logCompanyEvent, logUserEvent } from "./domain/activity/logEvent";
import { 
  insertCompanySchema, 
  insertSecurityClassSchema,
  insertStakeholderSchema,
  insertShareLedgerEntrySchema,
  insertEquityAwardSchema,
  insertConvertibleInstrumentSchema,
  insertRoundSchema,
  insertCorporateActionSchema,
  insertUserSchema,
  insertCapTableShareSchema
} from "@shared/schema";
import { z } from "zod";
import { insertScenarioSchema } from "@shared/schema";
import { requireAuth, optionalAuth, generateToken, hashPassword, comparePassword, AuthenticatedRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, name } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      
      // Handle different name formats
      let userFirstName = firstName;
      let userLastName = lastName;
      
      if (!firstName && !lastName && name) {
        const nameParts = name.trim().split(' ');
        userFirstName = nameParts[0] || '';
        userLastName = nameParts.slice(1).join(' ') || '';
      }
      
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: userFirstName || null,
        lastName: userLastName || null,
      });
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      
      res.json({ 
        user: userResponse, 
        token,
        message: "Registration successful" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      
      res.json({ 
        user: userResponse, 
        token,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Company routes
  app.get("/api/companies", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const companies = await storage.getUserCompanies(req.user!.id);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:companyId", requireAuth, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validated);
      
      // Grant owner access to the creator
      await storage.createUserCompanyAccess({
        userId: req.user!.id,
        companyId: company.id,
        role: "owner",
        acceptedAt: new Date(),
      });

      // Log company creation
      await logCompanyEvent({
        companyId: company.id,
        actorId: req.user!.id,
        event: "company.created",
      });

      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.put("/api/companies/:companyId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const updateData = insertCompanySchema.partial().parse(req.body);
      
      // Get current company data for change detection
      const currentCompany = await storage.getCompany(companyId);
      if (!currentCompany) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      const company = await storage.updateCompany(companyId, updateData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Detect changed fields for audit log
      const changedFields: Record<string, any> = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] !== currentCompany[key as keyof typeof currentCompany]) {
          changedFields[key] = {
            from: currentCompany[key as keyof typeof currentCompany],
            to: updateData[key as keyof typeof updateData]
          };
        }
      });

      // Log company update
      await logCompanyEvent({
        companyId: company.id,
        actorId: req.user!.id,
        event: "company.updated",
        changes: changedFields,
      });

      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  // Activity/Audit Log routes
  app.get("/api/companies/:companyId/activity", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.params;
      const { cursor, limit = "20", event, resourceType, actorId, from, to } = req.query;
      
      const options = {
        cursor: cursor as string,
        limit: parseInt(limit as string),
        event: event as string,
        resourceType: resourceType as string,
        actorId: actorId as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      };
      
      const auditLogs = await storage.getAuditLogs(companyId, options);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Security class routes
  app.get("/api/companies/:companyId/security-classes", async (req, res) => {
    try {
      const securityClasses = await storage.getSecurityClasses(req.params.companyId);
      res.json(securityClasses);
    } catch (error) {
      console.error("Error fetching security classes:", error);
      res.status(500).json({ error: "Failed to fetch security classes" });
    }
  });

  app.post("/api/companies/:companyId/security-classes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertSecurityClassSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const securityClass = await storage.createSecurityClass(validated);
      res.status(201).json(securityClass);
    } catch (error) {
      console.error("Error creating security class:", error);
      res.status(500).json({ error: "Failed to create security class" });
    }
  });

  // Stakeholder routes
  app.get("/api/companies/:companyId/stakeholders", async (req, res) => {
    try {
      const stakeholders = await storage.getStakeholders(req.params.companyId);
      res.json(stakeholders);
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
      res.status(500).json({ error: "Failed to fetch stakeholders" });
    }
  });

  app.post("/api/companies/:companyId/stakeholders", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertStakeholderSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const stakeholder = await storage.createStakeholder(validated);
      
      // Log stakeholder creation
      await logStakeholderEvent({
        companyId: req.params.companyId,
        actorId: req.user!.id,
        event: "stakeholder.created",
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        stakeholderType: stakeholder.type,
      });

      res.status(201).json(stakeholder);
    } catch (error) {
      console.error("Error creating stakeholder:", error);
      res.status(500).json({ error: "Failed to create stakeholder" });
    }
  });

  app.put("/api/stakeholders/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertStakeholderSchema.partial().parse(req.body);
      
      // Get current stakeholder for change detection
      const currentStakeholder = await storage.getStakeholder(id);
      if (!currentStakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      
      const stakeholder = await storage.updateStakeholder(id, updateData);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }

      // Detect changes
      const changes: Record<string, any> = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] !== currentStakeholder[key as keyof typeof currentStakeholder]) {
          changes[key] = {
            from: currentStakeholder[key as keyof typeof currentStakeholder],
            to: updateData[key as keyof typeof updateData]
          };
        }
      });

      // Log stakeholder update
      await logStakeholderEvent({
        companyId: stakeholder.companyId,
        actorId: req.user!.id,
        event: "stakeholder.updated",
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        stakeholderType: stakeholder.type,
        changes,
      });

      res.json(stakeholder);
    } catch (error) {
      console.error("Error updating stakeholder:", error);
      res.status(500).json({ error: "Failed to update stakeholder" });
    }
  });

  app.delete("/api/stakeholders/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const stakeholder = await storage.getStakeholder(id);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }

      await storage.deleteStakeholder(id);

      // Log stakeholder deletion
      await logStakeholderEvent({
        companyId: stakeholder.companyId,
        actorId: req.user!.id,
        event: "stakeholder.deleted",
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        stakeholderType: stakeholder.type,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
      res.status(500).json({ error: "Failed to delete stakeholder" });
    }
  });

  // Share ledger routes
  app.get("/api/companies/:companyId/share-ledger", async (req, res) => {
    try {
      const entries = await storage.getShareLedgerEntries(req.params.companyId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching share ledger:", error);
      res.status(500).json({ error: "Failed to fetch share ledger" });
    }
  });

  app.post("/api/companies/:companyId/share-ledger", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertShareLedgerEntrySchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      
      const entry = await storage.createShareLedgerEntry(validated);
      
      // Get stakeholder and security class for audit log
      const stakeholder = await storage.getStakeholder(entry.stakeholderId);
      const securityClass = await storage.getSecurityClass(entry.securityClassId);
      
      // Log share issuance
      await logTransactionEvent({
        companyId: req.params.companyId,
        actorId: req.user!.id,
        event: "transaction.shares_issued",
        transactionId: entry.id,
        stakeholderName: stakeholder?.name,
        details: {
          quantity: entry.quantity,
          securityClassName: securityClass?.name,
          consideration: entry.consideration,
        },
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating share ledger entry:", error);
      res.status(500).json({ error: "Failed to create share ledger entry" });
    }
  });

  // Equity awards routes
  app.get("/api/companies/:companyId/equity-awards", async (req, res) => {
    try {
      const awards = await storage.getEquityAwards(req.params.companyId);
      res.json(awards);
    } catch (error) {
      console.error("Error fetching equity awards:", error);
      res.status(500).json({ error: "Failed to fetch equity awards" });
    }
  });

  app.post("/api/companies/:companyId/equity-awards", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertEquityAwardSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      
      const award = await storage.createEquityAward(validated);
      
      // Get stakeholder for audit log
      const stakeholder = await storage.getStakeholder(award.holderId);
      
      // Log equity award
      await logTransactionEvent({
        companyId: req.params.companyId,
        actorId: req.user!.id,
        event: "transaction.options_granted",
        transactionId: award.id,
        stakeholderName: stakeholder?.name,
        details: {
          awardType: award.type,
          quantity: award.quantityGranted,
          strikePrice: award.strikePrice,
          grantDate: award.grantDate,
        },
      });

      res.status(201).json(award);
    } catch (error) {
      console.error("Error creating equity award:", error);
      res.status(500).json({ error: "Failed to create equity award" });
    }
  });

  // Convertible instruments routes
  app.get("/api/companies/:companyId/convertibles", async (req, res) => {
    try {
      const instruments = await storage.getConvertibleInstruments(req.params.companyId);
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching convertibles:", error);
      res.status(500).json({ error: "Failed to fetch convertibles" });
    }
  });

  app.post("/api/companies/:companyId/convertibles", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertConvertibleInstrumentSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      
      const instrument = await storage.createConvertibleInstrument(validated);
      
      // Get stakeholder for audit log
      const stakeholder = await storage.getStakeholder(instrument.holderId);
      
      // Log convertible creation
      const eventType = instrument.type === "safe" ? "transaction.safe_created" : "transaction.convertible_created";
      await logTransactionEvent({
        companyId: req.params.companyId,
        actorId: req.user!.id,
        event: eventType,
        transactionId: instrument.id,
        stakeholderName: stakeholder?.name,
        details: {
          instrumentType: instrument.type,
          framework: instrument.framework,
          principal: instrument.principal,
          issueDate: instrument.issueDate,
        },
      });

      res.status(201).json(instrument);
    } catch (error) {
      console.error("Error creating convertible:", error);
      res.status(500).json({ error: "Failed to create convertible" });
    }
  });

  // Legacy audit log route (for backwards compatibility)
  app.get("/api/companies/:companyId/audit-logs", async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogs(req.params.companyId);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Cap table calculation routes
  app.get("/api/companies/:companyId/cap-table", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Fetch all the data needed for cap table calculation
      const [stakeholders, securityClasses, shareLedger, equityAwards, convertibles] = await Promise.all([
        storage.getStakeholders(companyId),
        storage.getSecurityClasses(companyId),
        storage.getShareLedgerEntries(companyId),
        storage.getEquityAwards(companyId),
        storage.getConvertibleInstruments(companyId)
      ]);

      // Calculate cap table statistics
      const totalShares = shareLedger.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      const totalOptions = equityAwards.reduce((sum, award) => sum + Number(award.quantityGranted), 0);
      const totalConvertibles = convertibles.reduce((sum, conv) => sum + Number(conv.principal), 0);

      // Build stakeholder ownership map
      const ownershipMap = new Map();
      
      // Add shares
      shareLedger.forEach(entry => {
        const existing = ownershipMap.get(entry.stakeholderId) || { shares: 0, options: 0, convertibles: 0 };
        existing.shares += Number(entry.quantity);
        ownershipMap.set(entry.stakeholderId, existing);
      });
      
      // Add options
      equityAwards.forEach(award => {
        const existing = ownershipMap.get(award.holderId) || { shares: 0, options: 0, convertibles: 0 };
        existing.options += Number(award.quantityGranted);
        ownershipMap.set(award.holderId, existing);
      });

      // Build cap table with ownership percentages
      const capTable = Array.from(ownershipMap.entries()).map(([stakeholderId, holdings]) => {
        const stakeholder = stakeholders.find(s => s.id === stakeholderId);
        const percentage = totalShares > 0 ? (holdings.shares / totalShares) * 100 : 0;
        
        return {
          stakeholder: stakeholder?.name || "Unknown",
          stakeholderId,
          shares: holdings.shares,
          options: holdings.options,
          percentage: percentage.toFixed(2),
          value: holdings.shares * 1.0 // Assuming $1.00 per share for now
        };
      });

      res.json({
        stats: {
          totalShares,
          totalOptions,
          totalConvertibles,
          stakeholderCount: stakeholders.length
        },
        capTable
      });
    } catch (error) {
      console.error("Error calculating cap table:", error);
      res.status(500).json({ error: "Failed to calculate cap table" });
    }
  });

  // Scenarios routes
  app.get("/api/companies/:companyId/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getScenarios(req.params.companyId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  app.post("/api/companies/:companyId/scenarios", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertScenarioSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const scenario = await storage.createScenario(validated);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  app.put("/api/scenarios/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertScenarioSchema.partial().parse(req.body);
      const scenario = await storage.updateScenario(id, updateData);
      
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      res.json(scenario);
    } catch (error) {
      console.error("Error updating scenario:", error);
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  app.delete("/api/scenarios/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteScenario(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // Cap table sharing routes
  app.get("/api/companies/:companyId/cap-table-shares", requireAuth, async (req, res) => {
    try {
      const shares = await storage.getCapTableShares(req.params.companyId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching cap table shares:", error);
      res.status(500).json({ error: "Failed to fetch cap table shares" });
    }
  });

  app.post("/api/companies/:companyId/cap-table-shares", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertCapTableShareSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
        createdBy: req.user!.id,
        shareToken: `share_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });
      const share = await storage.createCapTableShare(validated);
      res.status(201).json(share);
    } catch (error) {
      console.error("Error creating cap table share:", error);
      res.status(500).json({ error: "Failed to create cap table share" });
    }
  });

  // Public cap table share access
  app.get("/api/shared/:token", async (req, res) => {
    try {
      const share = await storage.getCapTableShare(req.params.token);
      if (!share || !share.isActive) {
        return res.status(404).json({ error: "Share not found or expired" });
      }
      
      if (share.expiresAt && new Date() > share.expiresAt) {
        return res.status(404).json({ error: "Share has expired" });
      }
      
      // Update view count and last accessed
      await storage.updateCapTableShare(share.id, {
        viewCount: share.viewCount + 1,
        lastAccessed: new Date()
      });
      
      // Get cap table data (same as private route but with redacted info based on permissions)
      const [stakeholders, shareLedger] = await Promise.all([
        storage.getStakeholders(share.companyId),
        storage.getShareLedgerEntries(share.companyId)
      ]);
      
      const ownershipMap = new Map();
      shareLedger.forEach(entry => {
        const existing = ownershipMap.get(entry.stakeholderId) || { shares: 0 };
        existing.shares += Number(entry.quantity);
        ownershipMap.set(entry.stakeholderId, existing);
      });
      
      const totalShares = shareLedger.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      
      const capTable = Array.from(ownershipMap.entries()).map(([stakeholderId, holdings]) => {
        const stakeholder = stakeholders.find(s => s.id === stakeholderId);
        const percentage = totalShares > 0 ? (holdings.shares / totalShares) * 100 : 0;
        
        return {
          stakeholder: stakeholder?.name || "Unknown",
          shares: holdings.shares,
          percentage: percentage.toFixed(2)
        };
      });
      
      res.json({
        share: {
          title: share.title,
          description: share.description,
          createdAt: share.createdAt
        },
        capTable
      });
    } catch (error) {
      console.error("Error fetching shared cap table:", error);
      res.status(500).json({ error: "Failed to fetch shared cap table" });
    }
  });

  return createServer(app);
}