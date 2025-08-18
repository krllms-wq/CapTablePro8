import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertSecurityClassSchema,
  insertStakeholderSchema,
  insertShareLedgerEntrySchema,
  insertEquityAwardSchema,
  insertConvertibleInstrumentSchema,
  insertRoundSchema,
  insertCorporateActionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Companies
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validated = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validated);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid company data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  // Security Classes
  app.get("/api/companies/:companyId/security-classes", async (req, res) => {
    try {
      const securityClasses = await storage.getSecurityClasses(req.params.companyId);
      res.json(securityClasses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security classes" });
    }
  });

  app.post("/api/companies/:companyId/security-classes", async (req, res) => {
    try {
      const validated = insertSecurityClassSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const securityClass = await storage.createSecurityClass(validated);
      res.status(201).json(securityClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid security class data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create security class" });
    }
  });

  // Stakeholders
  app.get("/api/companies/:companyId/stakeholders", async (req, res) => {
    try {
      const stakeholders = await storage.getStakeholders(req.params.companyId);
      res.json(stakeholders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholders" });
    }
  });

  app.post("/api/companies/:companyId/stakeholders", async (req, res) => {
    try {
      const validated = insertStakeholderSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const stakeholder = await storage.createStakeholder(validated);
      res.status(201).json(stakeholder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid stakeholder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create stakeholder" });
    }
  });

  // Share Ledger Entries
  app.get("/api/companies/:companyId/share-ledger", async (req, res) => {
    try {
      const entries = await storage.getShareLedgerEntries(req.params.companyId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch share ledger entries" });
    }
  });

  app.post("/api/companies/:companyId/share-ledger", async (req, res) => {
    try {
      const validated = insertShareLedgerEntrySchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const entry = await storage.createShareLedgerEntry(validated);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid share ledger entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create share ledger entry" });
    }
  });

  // Equity Awards
  app.get("/api/companies/:companyId/equity-awards", async (req, res) => {
    try {
      const awards = await storage.getEquityAwards(req.params.companyId);
      res.json(awards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equity awards" });
    }
  });

  app.post("/api/companies/:companyId/equity-awards", async (req, res) => {
    try {
      const validated = insertEquityAwardSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const award = await storage.createEquityAward(validated);
      res.status(201).json(award);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid equity award data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create equity award" });
    }
  });

  // Convertible Instruments
  app.get("/api/companies/:companyId/convertibles", async (req, res) => {
    try {
      const instruments = await storage.getConvertibleInstruments(req.params.companyId);
      res.json(instruments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch convertible instruments" });
    }
  });

  app.post("/api/companies/:companyId/convertibles", async (req, res) => {
    try {
      const validated = insertConvertibleInstrumentSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const instrument = await storage.createConvertibleInstrument(validated);
      res.status(201).json(instrument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid convertible instrument data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create convertible instrument" });
    }
  });

  // Rounds
  app.get("/api/companies/:companyId/rounds", async (req, res) => {
    try {
      const rounds = await storage.getRounds(req.params.companyId);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rounds" });
    }
  });

  app.post("/api/companies/:companyId/rounds", async (req, res) => {
    try {
      const validated = insertRoundSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const round = await storage.createRound(validated);
      res.status(201).json(round);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid round data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create round" });
    }
  });

  // Corporate Actions
  app.get("/api/companies/:companyId/corporate-actions", async (req, res) => {
    try {
      const actions = await storage.getCorporateActions(req.params.companyId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch corporate actions" });
    }
  });

  app.post("/api/companies/:companyId/corporate-actions", async (req, res) => {
    try {
      const validated = insertCorporateActionSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      const action = await storage.createCorporateAction(validated);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid corporate action data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create corporate action" });
    }
  });

  // Cap Table Calculations
  app.get("/api/companies/:companyId/cap-table", async (req, res) => {
    try {
      const [stakeholders, securityClasses, shareEntries, equityAwards] = await Promise.all([
        storage.getStakeholders(req.params.companyId),
        storage.getSecurityClasses(req.params.companyId),
        storage.getShareLedgerEntries(req.params.companyId),
        storage.getEquityAwards(req.params.companyId)
      ]);

      // Calculate cap table data
      const stakeholderMap = new Map(stakeholders.map(s => [s.id, s]));
      const securityClassMap = new Map(securityClasses.map(sc => [sc.id, sc]));

      // Group shares by holder and class
      const holdings = new Map<string, Map<string, number>>();
      let totalShares = 0;

      shareEntries.forEach(entry => {
        if (!holdings.has(entry.holderId)) {
          holdings.set(entry.holderId, new Map());
        }
        const holderShares = holdings.get(entry.holderId)!;
        const currentShares = holderShares.get(entry.classId) || 0;
        holderShares.set(entry.classId, currentShares + entry.quantity);
        totalShares += entry.quantity;
      });

      // Add option pool
      const optionPoolSize = 742850; // 15% of fully diluted
      const fullyDilutedShares = totalShares + optionPoolSize + equityAwards.reduce((sum, award) => 
        sum + (award.quantityGranted - award.quantityExercised - award.quantityCanceled), 0);

      // Build cap table rows
      const capTableRows = [];
      
      // Add stakeholder holdings
      for (const [holderId, classMap] of Array.from(holdings.entries())) {
        const stakeholder = stakeholderMap.get(holderId);
        if (!stakeholder) continue;

        for (const [classId, shares] of classMap) {
          const securityClass = securityClassMap.get(classId);
          if (!securityClass) continue;

          const ownership = (shares / fullyDilutedShares) * 100;
          const value = shares * 4.47; // Mock price per share

          capTableRows.push({
            stakeholder,
            securityClass,
            shares,
            ownership,
            value
          });
        }
      }

      // Add equity awards
      equityAwards.forEach(award => {
        const stakeholder = stakeholderMap.get(award.holderId);
        if (!stakeholder) return;

        const outstandingShares = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
        if (outstandingShares <= 0) return;

        const ownership = (outstandingShares / fullyDilutedShares) * 100;
        const value = outstandingShares * parseFloat(award.strikePrice || "0");

        capTableRows.push({
          stakeholder,
          securityClass: { name: `${award.type} Options` },
          shares: outstandingShares,
          ownership,
          value,
          isOption: true
        });
      });

      // Add option pool
      const optionPoolOwnership = (optionPoolSize / fullyDilutedShares) * 100;
      capTableRows.push({
        stakeholder: { name: "Employee Option Pool", title: "Available for grants", type: "pool" },
        securityClass: { name: "Options Pool" },
        shares: optionPoolSize,
        ownership: optionPoolOwnership,
        value: optionPoolSize * 4.47,
        isPool: true
      });

      const stats = {
        totalShares,
        fullyDilutedShares,
        currentValuation: fullyDilutedShares * 4.47,
        optionPoolAvailable: optionPoolSize
      };

      res.json({
        capTable: capTableRows,
        stats
      });
    } catch (error) {
      console.error("Cap table calculation error:", error);
      res.status(500).json({ error: "Failed to calculate cap table" });
    }
  });

  // Audit Logs
  app.get("/api/companies/:companyId/audit-logs", async (req, res) => {
    try {
      const logs = await storage.getAuditLogs(req.params.companyId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Round modeling
  app.post("/api/companies/:id/rounds/model", async (req, res) => {
    try {
      const { raiseAmount, preMoneyValuation, pricePerShare, optionPoolIncrease } = req.body;
      
      // Simple round modeling calculation
      const preMoneyVal = preMoneyValuation || 20000000;
      const postMoneyVal = preMoneyVal + raiseAmount;
      const calculatedPricePerShare = pricePerShare || preMoneyVal / 10000000; // Assuming 10M outstanding shares
      const newShares = Math.round(raiseAmount / calculatedPricePerShare);
      const dilution = (raiseAmount / postMoneyVal) * 100;
      const optionPoolShares = optionPoolIncrease ? Math.round(newShares * (optionPoolIncrease / 100)) : 0;

      res.json({
        preMoneyValuation: preMoneyVal,
        postMoneyValuation: postMoneyVal,
        pricePerShare: calculatedPricePerShare,
        newShares,
        dilution,
        optionPoolShares: optionPoolShares || undefined,
      });
    } catch (error) {
      console.error("Error modeling round:", error);
      res.status(500).json({ error: "Failed to model round" });
    }
  });

  // Individual stakeholder endpoint
  app.get("/api/companies/:companyId/stakeholders/:stakeholderId", async (req, res) => {
    try {
      const stakeholder = await storage.getStakeholder(req.params.stakeholderId);
      if (!stakeholder || stakeholder.companyId !== req.params.companyId) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.json(stakeholder);
    } catch (error) {
      console.error("Error fetching stakeholder:", error);
      res.status(500).json({ error: "Failed to fetch stakeholder" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
