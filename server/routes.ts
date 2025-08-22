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
import { seedExampleCompany } from "./domain/onboarding/seedExampleCompany";
import demoRoutes from "./routes/demo";
import { sanitizeNumber, sanitizeDecimal, sanitizeQuantity } from "./utils/numberParser";
import { toDateOnlyUTC } from "@shared/utils/dateUtils";
import { ensurePricePerShare } from "./domain/util/price";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Demo routes
  app.use("/api/demo", demoRoutes);
  
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
      
      // Auto-seed demo company if enabled
      if (process.env.DEMO_SEED_ON_SIGNUP === 'true') {
        try {
          console.log('Seeding demo company on signup for user:', user.id);
          const { seedMinimalDemo } = await import('./domain/onboarding/seedMinimalDemo');
          const result = await seedMinimalDemo({ userId: user.id });
          console.log('Demo company seeded on signup:', result.companyId);
        } catch (error) {
          console.error('Error seeding demo company on signup:', error);
        }
      }
      
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

  // Logout route
  app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Since we're using JWT tokens, we don't need to do anything on the server side
      // The client will remove the token from localStorage
      // In a production app, you might want to add the token to a blacklist
      
      res.status(204).send(); // 204 No Content - logout successful
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Auto-seed demo company if enabled  
      if (process.env.DEMO_SEED_ON_LOGIN_FOR_ALL === 'true') {
        try {
          console.log('Auto-seeding demo company for user:', user.id);
          const { seedMinimalDemo } = await import('./domain/onboarding/seedMinimalDemo');
          const result = await seedMinimalDemo({ userId: user.id });
          console.log('Demo company seeded successfully:', result.companyId);
        } catch (error) {
          console.error('Error auto-seeding demo company:', error);
        }
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
      console.log(`Fetching companies for user: ${req.user!.id}`);
      const companies = await storage.getUserCompanies(req.user!.id);
      console.log(`Found ${companies.length} companies for user ${req.user!.id}`);
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
      // Validate required fields first
      const { name, incorporationDate } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ 
          error: "Company name is required and cannot be empty" 
        });
      }
      
      if (!incorporationDate) {
        return res.status(400).json({ 
          error: "Incorporation date is required" 
        });
      }

      // Normalize incorporation date to date-only UTC
      let normalizedDate: Date;
      try {
        normalizedDate = new Date(incorporationDate + 'T00:00:00.000Z');
      } catch (dateError) {
        return res.status(400).json({ 
          error: "Invalid incorporation date format. Please provide a valid date." 
        });
      }

      // Prepare data for validation with normalized date and defaults
      const companyData = {
        name: name.trim(),
        description: req.body.description || undefined,
        country: req.body.country || "US",
        jurisdiction: req.body.jurisdiction || "Delaware", 
        currency: req.body.currency || "USD",
        parValue: req.body.parValue || "0.0001",
        incorporationDate: normalizedDate,
        authorizedShares: req.body.authorizedShares || 10000000,
        ownerId: req.user!.id
      };

      // Validate with schema (this will catch any remaining validation issues)
      const validated = insertCompanySchema.parse(companyData);
      
      // Create company
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
      
      // Handle Zod validation errors with more specific messages
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const fieldName = firstError.path.join('.');
        
        // Map common validation errors to user-friendly messages
        if (fieldName === 'name' && firstError.code === 'too_small') {
          return res.status(400).json({ 
            error: "Company name is required and cannot be empty" 
          });
        }
        
        if (fieldName === 'incorporationDate') {
          return res.status(400).json({ 
            error: "Invalid incorporation date format. Please provide a valid date." 
          });
        }
        
        if (fieldName === 'authorizedShares' && firstError.code === 'invalid_type') {
          return res.status(400).json({ 
            error: "Authorized shares must be a valid number" 
          });
        }
        
        // Generic validation error
        return res.status(400).json({ 
          error: `Validation failed: ${fieldName} ${firstError.message}` 
        });
      }
      
      // Handle duplicate company names or other known errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          return res.status(400).json({ 
            error: "A company with this name already exists" 
          });
        }
        
        return res.status(400).json({ 
          error: error.message 
        });
      }
      
      // Generic server error
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

  // Delete company
  app.delete("/api/companies/:companyId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      
      // Check if company exists and user has access
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      console.log(`Delete company: userId=${req.user!.id}, companyOwnerId=${company.ownerId}, companyName=${company.name}`);

      // Check if user is the owner of the company or has access to it
      // First check direct ownership
      if (company.ownerId === req.user!.id) {
        console.log("User is direct owner, allowing deletion");
      } else {
        // Check if user has access through userCompanyAccess (for demo companies)
        const userCompanies = await storage.getUserCompanies(req.user!.id);
        const hasAccess = userCompanies.some(c => c.id === companyId);
        
        if (!hasAccess) {
          console.log("User does not own company and has no access, denying deletion");
          return res.status(403).json({ error: "Access denied. Only company owners can delete companies." });
        }
        console.log("User has access to company, allowing deletion");
      }

      // Log company deletion before deleting (since we won't be able to log after)
      await logCompanyEvent({
        companyId: company.id,
        actorId: req.user!.id,
        event: "company.updated",
        changes: {
          companyName: company.name,
          deletedAt: new Date().toISOString()
        }
      });

      // Delete the company (this should cascade delete all related data)
      await storage.deleteCompany(companyId);

      res.status(204).send(); // 204 No Content - successful deletion
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Activity/Audit Log routes  
  app.get("/api/companies/:companyId/activity", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.params;
      const { cursor, limit = "20", event, resourceType, actorId, from, to } = req.query;
      
      console.log(`Activity endpoint called for company ${companyId} with filters:`, { event, resourceType, cursor });
      
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
      
      // Ensure proper ordering: createdAt DESC, id DESC for stable pagination
      const sorted = auditLogs.sort((a, b) => {
        const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id); // Secondary sort by ID for stable pagination
      });
      
      console.log(`Activity endpoint returning ${sorted.length} entries`);
      res.json(sorted);
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

  app.put("/api/companies/:companyId/security-classes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSecurityClassSchema.partial().parse(req.body);
      
      const securityClass = await storage.updateSecurityClass(id, updateData);
      if (!securityClass) {
        return res.status(404).json({ error: "Security class not found" });
      }
      
      res.json(securityClass);
    } catch (error) {
      console.error("Error updating security class:", error);
      res.status(500).json({ error: "Failed to update security class" });
    }
  });

  app.delete("/api/companies/:companyId/security-classes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id, companyId } = req.params;
      
      // Check if security class exists
      const securityClass = await storage.getSecurityClass(id);
      if (!securityClass) {
        return res.status(404).json({ error: "Security class not found" });
      }
      
      // Check if security class belongs to the company
      if (securityClass.companyId !== companyId) {
        return res.status(403).json({ error: "Security class does not belong to this company" });
      }
      
      // Check if security class is used in any transactions
      const shareLedgerEntries = await storage.getShareLedgerEntries(companyId);
      const hasShareEntries = shareLedgerEntries.some(entry => entry.classId === id);
      
      if (hasShareEntries) {
        return res.status(409).json({ 
          error: `Cannot delete security class "${securityClass.name}" because it is used in share transactions. Please remove all transactions using this class first.` 
        });
      }
      
      // Note: Equity awards don't directly reference security classes in current schema
      
      // Check if security class is used in rounds
      const rounds = await storage.getRounds(companyId);
      const hasRounds = rounds.some(round => round.newSecurityClassId === id);
      
      if (hasRounds) {
        return res.status(409).json({ 
          error: `Cannot delete security class "${securityClass.name}" because it is used in funding rounds. Please remove all rounds using this class first.` 
        });
      }
      
      // Delete the security class
      await storage.deleteSecurityClass(id);
      
      res.status(204).send(); // 204 No Content - successful deletion
    } catch (error) {
      console.error("Error deleting security class:", error);
      res.status(500).json({ error: "Failed to delete security class" });
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

      // Check if stakeholder has any holdings (shares, equity awards, convertibles)
      const [shareEntries, equityAwards, convertibles] = await Promise.all([
        storage.getShareLedgerEntries(stakeholder.companyId),
        storage.getEquityAwards(stakeholder.companyId),
        storage.getConvertibleInstruments(stakeholder.companyId)
      ]);

      const hasShares = shareEntries.some(entry => entry.holderId === id);
      const hasEquityAwards = equityAwards.some(award => award.holderId === id);
      const hasConvertibles = convertibles.some(convertible => convertible.holderId === id);

      if (hasShares || hasEquityAwards || hasConvertibles) {
        return res.status(409).json({ 
          error: "Cannot delete stakeholder with holdings",
          code: "HAS_HOLDINGS",
          details: {
            hasShares,
            hasEquityAwards,
            hasConvertibles
          }
        });
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
      // Order by issueDate DESC, then createdAt DESC for consistent ordering
      const sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a.issueDate).getTime();
        const dateB = new Date(b.issueDate).getTime();
        if (dateA !== dateB) {
          return dateB - dateA; // issueDate DESC
        }
        // If issue dates are equal, sort by createdAt DESC
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      res.json(sortedEntries);
    } catch (error) {
      console.error("Error fetching share ledger:", error);
      res.status(500).json({ error: "Failed to fetch share ledger" });
    }
  });

  app.post("/api/companies/:companyId/share-ledger", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Sanitize numeric inputs
      const sanitizedBody = {
        ...req.body,
        companyId: req.params.companyId,
        quantity: sanitizeQuantity(req.body.quantity),
        consideration: req.body.consideration ? sanitizeDecimal(req.body.consideration) : null,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate + 'T00:00:00.000Z') : new Date()
      };

      // Ensure price per share is computed if missing but derivable
      const withPricePerShare = ensurePricePerShare(sanitizedBody);

      const validated = insertShareLedgerEntrySchema.parse(withPricePerShare);
      
      const entry = await storage.createShareLedgerEntry(validated);
      
      // Get stakeholder and security class for audit log
      const stakeholder = await storage.getStakeholder(entry.holderId);
      const securityClass = await storage.getSecurityClass(entry.classId);
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create share ledger entry" });
    }
  });

  // Secondary transfer route (atomic seller -> buyer transaction)
  app.post("/api/companies/:companyId/secondary-transfer", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const sanitizedBody = {
        ...req.body,
        companyId: req.params.companyId,
        quantity: sanitizeQuantity(req.body.quantity),
        pricePerShare: req.body.pricePerShare ? sanitizeDecimal(req.body.pricePerShare) : "0.00",
        transactionDate: req.body.transactionDate ? new Date(req.body.transactionDate + 'T00:00:00.000Z') : new Date()
      };

      let { sellerId, buyerId, classId, quantity, pricePerShare, transactionDate } = sanitizedBody;

      if (!sellerId || !buyerId || !classId || quantity <= 0) {
        return res.status(400).json({ 
          error: "Missing required fields: sellerId, buyerId, classId, and positive quantity" 
        });
      }

      // Handle new stakeholder creation if buyerId is "NEW_STAKEHOLDER"
      if (buyerId === "NEW_STAKEHOLDER") {
        // Create new stakeholder from the request data
        if (req.body.newBuyer && req.body.newBuyer.name) {
          const newStakeholder = await storage.createStakeholder({
            companyId: req.params.companyId,
            name: req.body.newBuyer.name,
            email: req.body.newBuyer.email || null,
            type: req.body.newBuyer.type || "individual"
          });
          buyerId = newStakeholder.id;
        } else {
          return res.status(400).json({
            error: "New buyer name is required when creating a new stakeholder",
            code: "MISSING_BUYER_NAME"
          });
        }
      } else {
        // Verify existing buyer exists
        const existingBuyer = await storage.getStakeholder(buyerId);
        if (!existingBuyer) {
          return res.status(400).json({
            error: "Buyer stakeholder not found",
            code: "BUYER_NOT_FOUND"
          });
        }
      }

      // Get current seller holdings to validate balance
      const sellerEntries = await storage.getShareLedgerEntries(req.params.companyId);
      const sellerBalance = sellerEntries
        .filter(entry => entry.holderId === sellerId && entry.classId === classId)
        .reduce((sum, entry) => sum + Number(entry.quantity), 0);

      if (sellerBalance < quantity) {
        return res.status(400).json({
          error: "Insufficient shares for transfer",
          code: "INSUFFICIENT_SHARES",
          details: {
            requested: quantity,
            available: sellerBalance
          }
        });
      }

      const totalValue = parseFloat(pricePerShare) * quantity;
      const transactionId = `transfer-${Date.now()}`;

      // Atomic transaction: create both ledger entries
      const [reductionEntry, additionEntry] = await Promise.all([
        // Subtract from seller
        storage.createShareLedgerEntry({
          companyId: req.params.companyId,
          holderId: sellerId,
          classId,
          quantity: -quantity,
          issueDate: transactionDate,
          consideration: parseFloat(totalValue.toFixed(2)),
          considerationType: "cash",
          sourceTransactionId: transactionId
        }),
        // Add to buyer
        storage.createShareLedgerEntry({
          companyId: req.params.companyId,
          holderId: buyerId,
          classId,
          quantity: quantity,
          issueDate: transactionDate,
          consideration: parseFloat(totalValue.toFixed(2)),
          considerationType: "cash",
          sourceTransactionId: transactionId
        })
      ]);

      // Log secondary transfer event
      const [seller, buyer, securityClass] = await Promise.all([
        storage.getStakeholder(sellerId),
        storage.getStakeholder(buyerId),
        storage.getSecurityClass(classId)
      ]);

      await logTransactionEvent({
        companyId: req.params.companyId,
        actorId: req.user!.id,
        event: "transaction.secondary_transfer",
        transactionId,
        stakeholderName: `${seller?.name} → ${buyer?.name}`,
        details: {
          seller: seller?.name,
          buyer: buyer?.name,
          quantity,
          pricePerShare,
          totalValue,
          securityClassName: securityClass?.name
        }
      });

      res.status(201).json({
        transactionId,
        reductionEntry,
        additionEntry,
        totalValue
      });
    } catch (error) {
      console.error("Error creating secondary transfer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create secondary transfer" });
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
      // Sanitize numeric inputs
      const sanitizedBody = {
        ...req.body,
        companyId: req.params.companyId,
        quantityGranted: typeof req.body.quantityGranted === 'string' ? parseInt(req.body.quantityGranted.replace(/,/g, ''), 10) : req.body.quantityGranted,
        strikePrice: (req.body.type === 'RSU' || !req.body.strikePrice) ? null : sanitizeDecimal(req.body.strikePrice),
        grantDate: req.body.grantDate ? new Date(req.body.grantDate + 'T00:00:00.000Z') : new Date(),
        vestingStartDate: req.body.vestingStartDate ? new Date(req.body.vestingStartDate + 'T00:00:00.000Z') : new Date(),
        exercisePrice: req.body.exercisePrice ? sanitizeDecimal(req.body.exercisePrice) : null
      };

      const validated = insertEquityAwardSchema.parse(sanitizedBody);
      
      const award = await storage.createEquityAward(validated);
      
      // Get stakeholder for audit log
      const stakeholder = await storage.getStakeholder(award.holderId);

      // Log equity award creation
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
          vestingStartDate: award.vestingStartDate
        }
      });
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create equity award" });
    }
  });

  // Convertible instruments routes
  app.get("/api/companies/:companyId/convertibles", async (req, res) => {
    try {
      const [instruments, stakeholders] = await Promise.all([
        storage.getConvertibleInstruments(req.params.companyId),
        storage.getStakeholders(req.params.companyId)
      ]);

      // Add stakeholder names to instruments
      const instrumentsWithNames = instruments.map(instrument => {
        const stakeholder = stakeholders.find(s => s.id === instrument.holderId);
        return {
          ...instrument,
          holderName: stakeholder?.name || 'Unknown'
        };
      });

      res.json(instrumentsWithNames);
    } catch (error) {
      console.error("Error fetching convertibles:", error);
      res.status(500).json({ error: "Failed to fetch convertibles" });
    }
  });

  app.post("/api/companies/:companyId/convertibles", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Sanitize numeric inputs
      const sanitizedBody = {
        ...req.body,
        companyId: req.params.companyId,
        principalAmount: req.body.principalAmount ? sanitizeDecimal(req.body.principalAmount) : "0.00",
        interestRate: req.body.interestRate ? sanitizeDecimal(req.body.interestRate) : "0.00",
        discountRate: req.body.discountRate ? sanitizeDecimal(req.body.discountRate) : null,
        valuationCap: req.body.valuationCap ? sanitizeDecimal(req.body.valuationCap) : null,
        issueDate: req.body.issueDate ? toDateOnlyUTC(req.body.issueDate) : toDateOnlyUTC(new Date()),
        maturityDate: req.body.maturityDate ? toDateOnlyUTC(req.body.maturityDate) : null
      };

      const validated = insertConvertibleInstrumentSchema.parse(sanitizedBody);
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create convertible" });
    }
  });

  // Legacy audit log route (for backwards compatibility)
  app.get("/api/companies/:companyId/audit-logs", requireAuth, async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogs(req.params.companyId);
      console.log(`Audit logs for ${req.params.companyId}:`, auditLogs.length, 'entries');
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



      // Get company rounds for valuation calculation
      const rounds = await storage.getRounds(companyId);
      
      // Import valuation calculator
      const { calculateFullyDilutedValuation, calculateCurrentValuation } = await import("./utils/valuationCalculator");
      
      // Get valuation source information
      console.log('Cap table endpoint - rounds found:', rounds.length);
      const currentValuationInfo = calculateCurrentValuation(rounds, shareLedger);
      console.log('Cap table endpoint - valuation result:', currentValuationInfo);
      
      // Calculate proper valuation with corrected math (prevent double counting)
      const valuationResult = calculateFullyDilutedValuation(
        rounds,
        shareLedger,
        equityAwards,
        convertibles,
        'granted', // Include granted RSUs in fully diluted
        10000000  // 10M option pool size - should come from company settings
      );

      // Calculate cap table statistics
      const totalShares = shareLedger.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      const totalOptionsOutstanding = equityAwards.reduce((sum, award) => {
        const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
        return sum + outstanding;
      }, 0);
      const totalConvertibles = convertibles.reduce((sum, conv) => sum + Number(conv.principal || 0), 0);

      // Build stakeholder ownership map with corrected calculations
      const ownershipMap = new Map();
      
      // Add shares (As-Issued)
      shareLedger.forEach(entry => {
        const existing = ownershipMap.get(entry.holderId) || { shares: 0, options: 0, convertibles: 0 };
        existing.shares += Number(entry.quantity);
        ownershipMap.set(entry.holderId, existing);
      });
      
      // Add outstanding equity awards only (prevent double counting)
      equityAwards.forEach(award => {
        const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
        if (outstanding > 0) {
          const existing = ownershipMap.get(award.holderId) || { shares: 0, options: 0, convertibles: 0 };
          existing.options += outstanding;
          ownershipMap.set(award.holderId, existing);
        }
      });

      // Add convertible instruments (SAFEs, Notes) to the ownership map
      convertibles.forEach(convertible => {
        const principal = Number(convertible.principal || 0);
        if (principal > 0) {
          const existing = ownershipMap.get(convertible.holderId) || { shares: 0, options: 0, convertibles: 0 };
          existing.convertibles += principal;
          ownershipMap.set(convertible.holderId, existing);
        }
      });

      // Build cap table with corrected ownership percentages
      const capTable = Array.from(ownershipMap.entries()).map(([holderId, holdings]) => {
        const stakeholder = stakeholders.find(s => s.id === holderId);
        
        // Calculate ownership based on fully diluted shares (corrected math)
        // Include convertibles in the diluted calculation
        const totalOutstandingShares = totalShares + totalOptionsOutstanding;
        
        // For stakeholders with only convertibles (no shares/options), show 0% until conversion
        // This is standard cap table practice - convertibles show potential value but 0% current ownership
        const currentOwnership = totalOutstandingShares > 0 
          ? ((holdings.shares + holdings.options) / totalOutstandingShares) * 100
          : 0;
        
        // Show fully diluted only if there are actual shares/options, not just convertibles
        const fullyDilutedPercentage = (valuationResult.fullyDilutedShares > 0) 
          ? ((holdings.shares + holdings.options) / valuationResult.fullyDilutedShares) * 100 
          : currentOwnership;
        
        // Calculate value based on current valuation
        const currentValue = valuationResult.pricePerShare 
          ? holdings.shares * valuationResult.pricePerShare
          : null;
        
        const fullyDilutedValue = valuationResult.pricePerShare 
          ? (holdings.shares + holdings.options) * valuationResult.pricePerShare
          : null;

        return {
          stakeholder: stakeholder?.name || "Unknown",
          stakeholderId: holderId,
          shares: holdings.shares,
          options: holdings.options,
          convertibles: holdings.convertibles || 0,
          percentage: currentOwnership.toFixed(2),
          currentValue: currentValue,
          fullyDilutedValue: fullyDilutedValue
        };
      });

      // Also add detailed convertibles data with stakeholder names
      const convertiblesWithNames = convertibles.map(convertible => {
        const stakeholder = stakeholders.find(s => s.id === convertible.holderId);
        return {
          ...convertible,
          holderName: stakeholder?.name || 'Unknown'
        };
      });

      res.json({
        stats: {
          totalShares,
          totalOptions: totalOptionsOutstanding,
          totalConvertibles,
          stakeholderCount: stakeholders.length,
          fullyDilutedShares: valuationResult.fullyDilutedShares,
          currentValuation: valuationResult.currentValuation,
          fullyDilutedValuation: valuationResult.fullyDilutedValuation,
          optionPoolAvailable: Math.max(0, 10000000 - totalOptionsOutstanding), // Unallocated pool
          pricePerShare: valuationResult.pricePerShare,
          valuationSource: currentValuationInfo.sourceDescription,
          rsuInclusionMode: 'granted'
        },
        capTable,
        convertibles: convertiblesWithNames,
        valuationInfo: {
          pricePerShare: valuationResult.pricePerShare,
          sharesOutstanding: valuationResult.sharesOutstanding,
          fullyDilutedShares: valuationResult.fullyDilutedShares,
          currentValuation: valuationResult.currentValuation,
          fullyDilutedValuation: valuationResult.fullyDilutedValuation,
          source: currentValuationInfo.source,
          sourceDescription: currentValuationInfo.sourceDescription,
          lastRoundDate: currentValuationInfo.lastRoundDate,
          lastRoundName: currentValuationInfo.lastRoundName
        }
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
      
      // Update view count and last accessed (removed viewCount as it's not in schema)
      await storage.updateCapTableShare(share.id, {
        // viewCount: share.viewCount + 1,  // Not in schema
      });
      
      // Get cap table data (same as private route but with redacted info based on permissions)
      const [stakeholders, shareLedger] = await Promise.all([
        storage.getStakeholders(share.companyId),
        storage.getShareLedgerEntries(share.companyId)
      ]);
      
      const ownershipMap = new Map();
      shareLedger.forEach(entry => {
        const existing = ownershipMap.get(entry.holderId) || { shares: 0 };
        existing.shares += Number(entry.quantity);
        ownershipMap.set(entry.holderId, existing);
      });
      
      const totalShares = shareLedger.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      
      const capTable = Array.from(ownershipMap.entries()).map(([holderId, holdings]) => {
        const stakeholder = stakeholders.find(s => s.id === holderId);
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

  // Round modeling endpoint
  app.post("/api/companies/:companyId/rounds/model", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const { roundAmount, premoney, investors = [] } = req.body;

      // Get current cap table data including SAFEs
      const [stakeholders, shareLedger, equityAwards, convertibles] = await Promise.all([
        storage.getStakeholders(companyId),
        storage.getShareLedgerEntries(companyId),
        storage.getEquityAwards(companyId),
        storage.getConvertibleInstruments(companyId)
      ]);

      // Calculate current ownership (before round)
      const ownershipMap = new Map();
      
      // Add shares
      shareLedger.forEach(entry => {
        const existing = ownershipMap.get(entry.holderId) || { shares: 0, options: 0 };
        existing.shares += Number(entry.quantity);
        ownershipMap.set(entry.holderId, existing);
      });
      
      // Add outstanding options
      equityAwards.forEach(award => {
        const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
        if (outstanding > 0) {
          const existing = ownershipMap.get(award.holderId) || { shares: 0, options: 0 };
          existing.options += outstanding;
          ownershipMap.set(award.holderId, existing);
        }
      });

      const totalShares = shareLedger.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      const totalOptions = equityAwards.reduce((sum, award) => {
        const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
        return sum + Math.max(0, outstanding);
      }, 0);

      // Before cap table
      const beforeCapTable = Array.from(ownershipMap.entries()).map(([holderId, holdings]) => {
        const stakeholder = stakeholders.find(s => s.id === holderId);
        const totalOutstanding = totalShares + totalOptions;
        const ownership = totalOutstanding > 0 ? ((holdings.shares + holdings.options) / totalOutstanding) * 100 : 0;
        
        return {
          stakeholder: { id: holderId, name: stakeholder?.name || "Unknown" },
          shares: holdings.shares,
          options: holdings.options,
          ownership: ownership
        };
      });

      // Handle SAFE conversions during priced round - Calculate first to determine total dilution
      const safeInstruments = convertibles.filter(c => c.type?.toLowerCase() === 'safe');
      let totalSafeShares = 0;
      const safeConversions = [];

      // Calculate initial price per share for SAFE conversion
      const initialPricePerShare = totalShares > 0 ? premoney / totalShares : 1;

      for (const safe of safeInstruments) {
        const principal = Number(safe.principal || 0);
        const valuationCap = Number(safe.valuationCap || 0);
        const discountRate = Number(safe.discountRate || 0);
        
        console.log(`Processing SAFE for ${safe.holderId}: principal=${principal}, cap=${valuationCap}, discount=${discountRate}`);

        if (principal > 0) {
          // Calculate conversion price using the lower of valuation cap or discounted round price
          let conversionPrice = initialPricePerShare;
          
          // Apply discount if specified
          if (discountRate > 0) {
            const discountedPrice = initialPricePerShare * (1 - discountRate);
            conversionPrice = Math.min(conversionPrice, discountedPrice);
          }
          
          // Apply valuation cap if specified
          if (valuationCap > 0) {
            const capPrice = valuationCap / totalShares; // Price based on valuation cap
            conversionPrice = Math.min(conversionPrice, capPrice);
          }

          const safeShares = Math.round(principal / conversionPrice);
          totalSafeShares += safeShares;
          
          safeConversions.push({
            holderId: safe.holderId,
            principal,
            conversionPrice,
            shares: safeShares
          });
        }
      }

      // CORRECT SAFE CONVERSION MATH:
      // The new investor should get exactly their target ownership percentage
      // SAFEs convert but should not dilute the new investor's intended ownership
      
      // Calculate target ownership for new investor: roundAmount / (premoney + roundAmount)
      const targetNewInvestorOwnership = roundAmount / (premoney + roundAmount);
      console.log(`Target new investor ownership: ${(targetNewInvestorOwnership * 100).toFixed(2)}%`);
      
      // Total shares after SAFE conversion but before new investment
      const sharesAfterSafeConversion = totalShares + totalSafeShares;
      
      // Calculate how many new shares are needed to give the new investor their target ownership
      // If new investor gets newShares and total becomes (sharesAfterSafeConversion + newShares)
      // Then: newShares / (sharesAfterSafeConversion + newShares) = targetNewInvestorOwnership
      // Solving: newShares = (targetNewInvestorOwnership * sharesAfterSafeConversion) / (1 - targetNewInvestorOwnership)
      const newShares = Math.round((targetNewInvestorOwnership * sharesAfterSafeConversion) / (1 - targetNewInvestorOwnership));
      
      // Final price per share to achieve this
      const finalPricePerShare = roundAmount / newShares;
      const postMoneyValuation = premoney + roundAmount;
      
      console.log(`SAFE conversion math:
        - Premoney: ${premoney}
        - Round amount: ${roundAmount} 
        - Target ownership: ${(targetNewInvestorOwnership * 100).toFixed(2)}%
        - Shares after SAFE: ${sharesAfterSafeConversion}
        - New shares needed: ${newShares}
        - Final PPS: ${finalPricePerShare.toFixed(4)}`);

      // After cap table (with new investment and SAFE conversions)
      const afterOwnershipMap = new Map(ownershipMap);

      // Add SAFE holders to after ownership map
      for (const conversion of safeConversions) {
        const existing = afterOwnershipMap.get(conversion.holderId) || { shares: 0, options: 0 };
        existing.shares += conversion.shares;
        afterOwnershipMap.set(conversion.holderId, existing);
      }
      
      // Add new investors  
      investors.forEach((investor: any) => {
        if (investor.name && investor.amount > 0) {
          const investorShares = Math.round(investor.amount / finalPricePerShare);
          afterOwnershipMap.set(investor.name, {
            shares: investorShares,
            options: 0
          });
        }
      });

      const totalSharesAfter = totalShares + newShares + totalSafeShares;
      const totalOutstandingAfter = totalSharesAfter + totalOptions;

      const afterCapTable = Array.from(afterOwnershipMap.entries()).map(([holderId, holdings]) => {
        let stakeholderName = "Unknown";
        let isNewInvestor = false;
        
        // Check if this is a new investor (not found in existing stakeholders)
        const existingStakeholder = stakeholders.find(s => s.id === holderId);
        if (existingStakeholder) {
          stakeholderName = existingStakeholder.name;
        } else {
          // This must be a new investor
          stakeholderName = holderId;
          isNewInvestor = true;
        }
        
        const ownership = totalOutstandingAfter > 0 ? ((holdings.shares + holdings.options) / totalOutstandingAfter) * 100 : 0;
        
        return {
          stakeholder: { id: holderId, name: stakeholderName },
          shares: holdings.shares,
          options: holdings.options,
          ownership: ownership,
          isNewInvestor
        };
      });

      res.json({
        beforeCapTable,
        afterCapTable,
        newShares,
        totalRaised: roundAmount,
        postMoneyValuation,
        pricePerShare: finalPricePerShare,
        safeConversions: safeConversions.length > 0 ? {
          totalConverted: safeConversions.length,
          totalPrincipal: safeConversions.reduce((sum, conv) => sum + conv.principal, 0),
          totalShares: totalSafeShares,
          conversions: safeConversions.map(conv => ({
            holderId: conv.holderId,
            holderName: stakeholders.find(s => s.id === conv.holderId)?.name || 'Unknown',
            principal: conv.principal,
            conversionPrice: conv.conversionPrice,
            shares: conv.shares
          }))
        } : null
      });
    } catch (error) {
      console.error("Error modeling round:", error);
      res.status(500).json({ error: "Failed to model round" });
    }
  });

  // Rich demo seeding endpoint
  app.post("/api/companies/:companyId/seed-rich-demo", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      
      // Verify company ownership - allow demo user access to demo companies
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Allow access if user owns the company OR it's a demo company and user is demo user
      const isDemoUser = req.user!.email === 'demo@example.com';
      const hasAccess = company.ownerId === req.user!.id || (company.isDemo && isDemoUser);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (!company.isDemo) {
        return res.status(400).json({ error: "Can only seed rich data for demo companies" });
      }
      
      const { seedRichDemoTransactions } = await import("./domain/onboarding/seedRichDemo");
      await seedRichDemoTransactions(storage, companyId);
      
      res.json({ message: "Rich demo transactions seeded successfully" });
    } catch (error) {
      console.error("Error seeding rich demo:", error);
      res.status(500).json({ error: "Failed to seed rich demo transactions" });
    }
  });

  // Conversion endpoints for Control Panel
  app.post("/api/companies/:companyId/convert-options", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const { convertAll } = req.body;

      if (convertAll) {
        const awards = await storage.getEquityAwards(companyId);
        const options = awards.filter(award => 
          (award.type === 'ISO' || award.type === 'NSO') && 
          award.quantityGranted > award.quantityExercised + award.quantityCanceled
        );

        // For demo purposes, just return success message
        res.json({ 
          message: `Would convert ${options.length} option grants to shares (demo mode)`,
          convertedOptions: options.length 
        });
      } else {
        res.json({ message: "No conversion performed" });
      }
    } catch (error) {
      console.error("Error converting options:", error);
      res.status(500).json({ error: "Failed to convert options" });
    }
  });

  app.post("/api/companies/:companyId/convert-safes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const { convertAll } = req.body;

      if (convertAll) {
        const instruments = await storage.getConvertibleInstruments(companyId);
        const safes = instruments.filter(instrument => instrument.type === 'safe');

        // Simulate SAFE conversion for scenario modeling only
        const simulations = [];
        
        for (const safe of safes) {
          const principal = Number(safe.principal || 0);
          const valuationCap = Number(safe.valuationCap || 0);
          const discountRate = Number(safe.discountRate || 0);
          
          if (principal > 0) {
            // Calculate theoretical conversion for display purposes only
            let conversionPrice = 1.0; // fallback
            if (valuationCap > 0) {
              conversionPrice = valuationCap / 5000000; // Use example total shares
            }
            
            // Apply discount if available
            if (discountRate > 0) {
              conversionPrice = conversionPrice * (1 - discountRate);
            }
            
            const sharesIssued = Math.round(principal / conversionPrice);
            
            simulations.push({
              holder: safe.holderId,
              principal,
              conversionPrice,
              shares: sharesIssued
            });
          }
        }
        
        res.json({ 
          message: `Simulated conversion of ${safes.length} SAFE instruments (scenario only)`,
          convertedSafes: safes.length,
          simulations,
          note: "This is a simulation - actual SAFEs remain unchanged"
        });
      } else {
        res.json({ message: "No conversion performed" });
      }
    } catch (error) {
      console.error("Error converting SAFEs:", error);
      res.status(500).json({ error: "Failed to convert SAFEs" });
    }
  });

  app.post("/api/companies/:companyId/convert-notes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const { convertAll } = req.body;

      if (convertAll) {
        const instruments = await storage.getConvertibleInstruments(companyId);
        const notes = instruments.filter(instrument => instrument.type === 'note');

        // For demo purposes, just return success message
        res.json({ 
          message: `Would convert ${notes.length} convertible notes to shares (demo mode)`,
          convertedNotes: notes.length 
        });
      } else {
        res.json({ message: "No conversion performed" });
      }
    } catch (error) {
      console.error("Error converting notes:", error);
      res.status(500).json({ error: "Failed to convert notes" });
    }
  });

  // Clean up duplicate stakeholders endpoint
  app.post("/api/companies/:companyId/cleanup-duplicates", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      
      const stakeholders = await storage.getStakeholders(companyId);
      const duplicateGroups = new Map();
      
      // Group stakeholders by name (case-insensitive)
      stakeholders.forEach(stakeholder => {
        const normalizedName = stakeholder.name.toLowerCase().trim();
        if (!duplicateGroups.has(normalizedName)) {
          duplicateGroups.set(normalizedName, []);
        }
        duplicateGroups.get(normalizedName).push(stakeholder);
      });
      
      let duplicatesFound = 0;
      let duplicatesRemoved = 0;
      
      // Process each group to remove duplicates
      for (const [name, group] of Array.from(duplicateGroups.entries())) {
        if (group.length > 1) {
          duplicatesFound += group.length - 1;
          
          // Keep the first one, remove the rest
          const [keep, ...remove] = group;
          
          for (const duplicate of remove) {
            // Only remove if they have no transactions or shares
            const shareEntries = await storage.getShareLedger(companyId);
            const holderEntries = shareEntries.filter(entry => entry.holderId === duplicate.id);
            const equityAwards = await storage.getEquityAwards(companyId);
            const holderAwards = equityAwards.filter(award => award.holderId === duplicate.id);
            
            if (holderEntries.length === 0 && holderAwards.length === 0) {
              await storage.deleteStakeholder(duplicate.id);
              duplicatesRemoved++;
            }
          }
        }
      }
      
      res.json({ 
        message: `Found ${duplicatesFound} duplicates, removed ${duplicatesRemoved} unused duplicates`,
        duplicatesFound,
        duplicatesRemoved
      });
      
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      res.status(500).json({ error: "Failed to clean up duplicates" });
    }
  });

  return createServer(app);
}