import { 
  type Company, type InsertCompany,
  type SecurityClass, type InsertSecurityClass,
  type Stakeholder, type InsertStakeholder,
  type ShareLedgerEntry, type InsertShareLedgerEntry,
  type EquityAward, type InsertEquityAward,
  type ConvertibleInstrument, type InsertConvertibleInstrument,
  type Round, type InsertRound,
  type CorporateAction, type InsertCorporateAction,
  type AuditLog,
  type Scenario, type InsertScenario,
  type User, type InsertUser,
  type UserCompanyAccess, type InsertUserCompanyAccess,
  type CapTableShare, type InsertCapTableShare
} from "@shared/schema";
import { 
  companies, securityClasses, stakeholders, shareLedgerEntries, equityAwards,
  convertibleInstruments, rounds, corporateActions, auditLogs, scenarios, users,
  userCompanyAccess, capTableShares
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Companies
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;

  // Security Classes
  createSecurityClass(securityClass: InsertSecurityClass): Promise<SecurityClass>;
  getSecurityClasses(companyId: string): Promise<SecurityClass[]>;
  getSecurityClass(id: string): Promise<SecurityClass | undefined>;
  updateSecurityClass(id: string, updates: Partial<InsertSecurityClass>): Promise<SecurityClass | undefined>;

  // Stakeholders
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  getStakeholders(companyId: string): Promise<Stakeholder[]>;
  getStakeholder(id: string): Promise<Stakeholder | undefined>;
  updateStakeholder(id: string, updates: Partial<InsertStakeholder>): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: string): Promise<void>;

  // Share Ledger Entries
  createShareLedgerEntry(entry: InsertShareLedgerEntry): Promise<ShareLedgerEntry>;
  getShareLedgerEntries(companyId: string): Promise<ShareLedgerEntry[]>;
  getShareLedgerEntry(id: string): Promise<ShareLedgerEntry | undefined>;

  // Equity Awards
  createEquityAward(award: InsertEquityAward): Promise<EquityAward>;
  getEquityAwards(companyId: string): Promise<EquityAward[]>;
  getEquityAward(id: string): Promise<EquityAward | undefined>;
  updateEquityAward(id: string, updates: Partial<InsertEquityAward>): Promise<EquityAward | undefined>;

  // Convertible Instruments
  createConvertibleInstrument(instrument: InsertConvertibleInstrument): Promise<ConvertibleInstrument>;
  getConvertibleInstruments(companyId: string): Promise<ConvertibleInstrument[]>;
  getConvertibleInstrument(id: string): Promise<ConvertibleInstrument | undefined>;

  // Rounds
  createRound(round: InsertRound): Promise<Round>;
  getRounds(companyId: string): Promise<Round[]>;
  getRound(id: string): Promise<Round | undefined>;

  // Corporate Actions
  createCorporateAction(action: InsertCorporateAction): Promise<CorporateAction>;
  getCorporateActions(companyId: string): Promise<CorporateAction[]>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getAuditLogs(companyId: string, options?: { cursor?: string; limit?: number; event?: string; resourceType?: string; actorId?: string; from?: Date; to?: Date }): Promise<AuditLog[]>;

  // Scenarios
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  getScenarios(companyId: string): Promise<Scenario[]>;
  getScenario(id: string): Promise<Scenario | undefined>;
  updateScenario(id: string, updates: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: string): Promise<void>;

  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // User Company Access
  createUserCompanyAccess(access: InsertUserCompanyAccess): Promise<UserCompanyAccess>;
  getUserCompanyAccess(userId: string, companyId: string): Promise<UserCompanyAccess | undefined>;
  getUserCompanies(userId: string): Promise<Company[]>;
  getCompanyUsers(companyId: string): Promise<UserCompanyAccess[]>;

  // Cap Table Sharing
  createCapTableShare(share: InsertCapTableShare): Promise<CapTableShare>;
  getCapTableShare(token: string): Promise<CapTableShare | undefined>;
  getCapTableShares(companyId: string): Promise<CapTableShare[]>;
  updateCapTableShare(id: string, updates: Partial<InsertCapTableShare>): Promise<CapTableShare | undefined>;
  deleteCapTableShare(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private companies: Map<string, Company> = new Map();
  private securityClasses: Map<string, SecurityClass> = new Map();
  private stakeholders: Map<string, Stakeholder> = new Map();
  private shareLedgerEntries: Map<string, ShareLedgerEntry> = new Map();
  private equityAwards: Map<string, EquityAward> = new Map();
  private convertibleInstruments: Map<string, ConvertibleInstrument> = new Map();
  private rounds: Map<string, Round> = new Map();
  private corporateActions: Map<string, CorporateAction> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private scenarios: Map<string, Scenario> = new Map();
  private users: Map<string, User> = new Map();
  private userCompanyAccess: Map<string, UserCompanyAccess> = new Map();
  private capTableShares: Map<string, CapTableShare> = new Map();

  // Database connection method
  private async getDbConnection() {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      return sql;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      return null;
    }
  }

  constructor() {
    this.seedData().catch(err => console.error('Error seeding data:', err));
  }

  private async seedData() {
    console.log('=== STARTING STORAGE SEED DATA ===');
    // Load existing companies from database first
    try {
      const dbConnection = await this.getDbConnection();
      console.log('Database connection:', dbConnection ? 'SUCCESS' : 'FAILED');
      if (dbConnection) {
        // Load all companies
        const companies = await dbConnection`SELECT * FROM companies`;
        console.log(`Found ${companies.length} companies in database`);
        for (const row of companies) {
          const company: Company = {
            id: row.id,
            name: row.name,
            description: row.description,
            country: row.country,
            jurisdiction: row.jurisdiction,
            currency: row.currency,
            parValue: row.par_value,
            incorporationDate: new Date(row.incorporation_date),
            authorizedShares: row.authorized_shares,
            ownerId: row.owner_id,
            isDemo: row.is_demo,
            createdAt: new Date(row.created_at),
          };
          this.companies.set(company.id, company);
        }

        // Load all stakeholders
        const stakeholders = await dbConnection`SELECT * FROM stakeholders`;
        for (const row of stakeholders) {
          const stakeholder: Stakeholder = {
            id: row.id,
            companyId: row.company_id,
            type: row.type,
            name: row.name,
            email: row.email,
            title: row.title,
            address: row.address,
            taxFlags: row.tax_flags,
            createdAt: new Date(row.created_at),
          };
          this.stakeholders.set(stakeholder.id, stakeholder);
        }

        // Load all security classes
        const securityClasses = await dbConnection`SELECT * FROM security_classes`;
        for (const row of securityClasses) {
          const securityClass: SecurityClass = {
            id: row.id,
            companyId: row.company_id,
            name: row.name,
            seniorityTier: row.seniority_tier,
            liquidationPreferenceMultiple: row.liquidation_preference_multiple,
            participating: row.participating,
            participationCap: row.participation_cap,
            dividendRate: row.dividend_rate,
            dividendType: row.dividend_type,
            convertToCommonRatio: row.convert_to_common_ratio,
            votingRights: row.voting_rights,
            createdAt: new Date(row.created_at),
          };
          this.securityClasses.set(securityClass.id, securityClass);
        }

        // Load all share ledger entries
        const shareEntries = await dbConnection`SELECT * FROM share_ledger_entries`;
        for (const row of shareEntries) {
          const entry: ShareLedgerEntry = {
            id: row.id,
            companyId: row.company_id,
            holderId: row.holder_id,
            classId: row.class_id,
            quantity: row.quantity,
            issueDate: new Date(row.issue_date),
            certificateNo: row.certificate_no,
            consideration: row.consideration,
            considerationType: row.consideration_type,
            sourceTransactionId: row.source_transaction_id,
            createdAt: new Date(row.created_at),
          };
          this.shareLedgerEntries.set(entry.id, entry);
        }

        console.log(`Loaded ${this.companies.size} companies, ${this.stakeholders.size} stakeholders, ${this.securityClasses.size} security classes, ${this.shareLedgerEntries.size} share entries from database`);
        console.log('Loaded companies:', Array.from(this.companies.values()).map(c => `${c.name} (owner: ${c.ownerId}, demo: ${c.isDemo})`));
        console.log('Demo companies:', Array.from(this.companies.values()).filter(c => c.isDemo).map(c => `${c.name} (owner: ${c.ownerId})`));
        
        // FORCE ADD DEMO COMPANY if not loaded
        const demoCompanyExists = Array.from(this.companies.values()).some(c => c.name === 'Example LLC' && c.isDemo);
        if (!demoCompanyExists) {
          console.log('FORCE ADDING Example LLC demo company to storage');
          const demoCompany: Company = {
            id: '5ceacfa9-6b26-4a00-a3b7-966e6e477a31',
            name: 'Example LLC',
            description: 'Demo company with sample data',
            country: 'US',
            jurisdiction: 'Delaware',
            currency: 'USD',
            parValue: '0.0001',
            incorporationDate: new Date('2024-01-01'),
            authorizedShares: 10000000,
            ownerId: 'ede1d408-0660-422e-b67a-f9609e5cf841',
            isDemo: true,
            createdAt: new Date()
          };
          this.companies.set(demoCompany.id, demoCompany);
          console.log('Demo company FORCE ADDED to storage');
        }
        
        return; // Exit early if data loaded from DB
      }
    } catch (error) {
      console.error('ERROR loading from database:', error);
      console.log('Falling back to seed data');
    }

    // Create a sample company (fallback)
    const companyId = randomUUID();
    const company: Company = {
      id: companyId,
      name: "TechStart Inc.",
      jurisdiction: "Delaware",
      description: "Series A SaaS Startup • Delaware C-Corp",
      country: "US",
      currency: "USD",
      parValue: "0.0001",
      incorporationDate: new Date("2022-01-15"),
      authorizedShares: 15000000,
      ownerId: "sample-user-id",
      isDemo: false,
      createdAt: new Date(),
    };
    this.companies.set(companyId, company);

    // Create security classes
    const commonClassId = randomUUID();
    const commonClass: SecurityClass = {
      id: commonClassId,
      companyId,
      name: "Common Stock",
      seniorityTier: 0,
      liquidationPreferenceMultiple: "1.0",
      participating: false,
      participationCap: null,
      dividendRate: "0.0",
      dividendType: "non-cumulative",
      convertToCommonRatio: "1.0",
      votingRights: "1.0",
      createdAt: new Date(),
    };
    this.securityClasses.set(commonClassId, commonClass);

    const seriesAClassId = randomUUID();
    const seriesAClass: SecurityClass = {
      id: seriesAClassId,
      companyId,
      name: "Series A Preferred",
      seniorityTier: 1,
      liquidationPreferenceMultiple: "1.0",
      participating: false,
      participationCap: null,
      dividendRate: "0.08",
      dividendType: "cumulative",
      convertToCommonRatio: "1.0",
      votingRights: "1.0",
      createdAt: new Date(),
    };
    this.securityClasses.set(seriesAClassId, seriesAClass);

    // Create stakeholders
    const founder1Id = randomUUID();
    const founder1: Stakeholder = {
      id: founder1Id,
      companyId,
      type: "person",
      name: "Jane Smith",
      email: "jane@techstart.com",
      title: "Founder & CEO",
      address: null,
      taxFlags: null,
      createdAt: new Date(),
    };
    this.stakeholders.set(founder1Id, founder1);

    const founder2Id = randomUUID();
    const founder2: Stakeholder = {
      id: founder2Id,
      companyId,
      type: "person",
      name: "Mike Davis",
      email: "mike@techstart.com",
      title: "Co-Founder & CTO",
      address: null,
      taxFlags: null,
      createdAt: new Date(),
    };
    this.stakeholders.set(founder2Id, founder2);

    const investorId = randomUUID();
    const investor: Stakeholder = {
      id: investorId,
      companyId,
      type: "entity",
      name: "Venture Capital Fund I",
      email: "investments@vcfund.com",
      title: "Series A Investor",
      address: null,
      taxFlags: null,
      createdAt: new Date(),
    };
    this.stakeholders.set(investorId, investor);

    const employeeId = randomUUID();
    const employee: Stakeholder = {
      id: employeeId,
      companyId,
      type: "person",
      name: "Sarah Adams",
      email: "sarah@techstart.com",
      title: "VP Engineering",
      address: null,
      taxFlags: null,
      createdAt: new Date(),
    };
    this.stakeholders.set(employeeId, employee);

    // Create share ledger entries
    const founder1SharesId = randomUUID();
    const founder1Shares: ShareLedgerEntry = {
      id: founder1SharesId,
      companyId,
      holderId: founder1Id,
      classId: commonClassId,
      quantity: 3542150,
      issueDate: new Date("2022-01-15"),
      certificateNo: "CS-001",
      consideration: "1000.00",
      considerationType: "cash",
      sourceTransactionId: null,
      createdAt: new Date(),
    };
    this.shareLedgerEntries.set(founder1SharesId, founder1Shares);

    const founder2SharesId = randomUUID();
    const founder2Shares: ShareLedgerEntry = {
      id: founder2SharesId,
      companyId,
      holderId: founder2Id,
      classId: commonClassId,
      quantity: 2850000,
      issueDate: new Date("2022-01-15"),
      certificateNo: "CS-002",
      consideration: "1000.00",
      considerationType: "cash",
      sourceTransactionId: null,
      createdAt: new Date(),
    };
    this.shareLedgerEntries.set(founder2SharesId, founder2Shares);

    const investorSharesId = randomUUID();
    const investorShares: ShareLedgerEntry = {
      id: investorSharesId,
      companyId,
      holderId: investorId,
      classId: seriesAClassId,
      quantity: 1500000,
      issueDate: new Date("2023-06-15"),
      certificateNo: "SA-001",
      consideration: "10000000.00",
      considerationType: "cash",
      sourceTransactionId: null,
      createdAt: new Date(),
    };
    this.shareLedgerEntries.set(investorSharesId, investorShares);

    // Create equity award
    const equityAwardId = randomUUID();
    const equityAward: EquityAward = {
      id: equityAwardId,
      companyId,
      holderId: employeeId,
      type: "ISO",
      planId: null,
      grantDate: new Date("2023-12-01"),
      strikePrice: "4.47",
      quantityGranted: 185000,
      quantityExercised: 0,
      quantityCanceled: 0,
      earlyExerciseAllowed: false,
      vestingStartDate: new Date("2023-12-01"),
      cliffMonths: 12,
      totalMonths: 48,
      cadence: "monthly",
      postTerminationExerciseWindowDays: 90,
      iso100kLimitTracking: true,
      createdAt: new Date(),
    };
    this.equityAwards.set(equityAwardId, equityAward);

    // Create a round
    const roundId = randomUUID();
    const round: Round = {
      id: roundId,
      companyId,
      name: "Series A",
      closeDate: new Date("2023-06-15"),
      preMoneyValuation: "30000000.00",
      raiseAmount: "10000000.00",
      pricePerShare: "6.67",
      newSecurityClassId: seriesAClassId,
      roundType: "priced",
      optionPoolIncrease: "0.15",
      optionPoolTiming: "pre-money",
      antiDilutionProvisions: "broad-based",
      payToPlay: false,
      createdAt: new Date(),
    };
    this.rounds.set(roundId, round);
  }

  // Companies
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      id,
      name: insertCompany.name,
      description: insertCompany.description ?? null,
      country: insertCompany.country ?? "US",
      jurisdiction: insertCompany.jurisdiction ?? "Delaware",
      currency: insertCompany.currency ?? "USD", 
      parValue: insertCompany.parValue ?? "0.0001",
      incorporationDate: insertCompany.incorporationDate,
      authorizedShares: insertCompany.authorizedShares ?? 10000000,
      ownerId: insertCompany.ownerId,
      isDemo: insertCompany.isDemo ?? false,
      createdAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompaniesForUser(userId: string): Promise<Company[]> {
    const companies = Array.from(this.companies.values()).filter(c => c.ownerId === userId);
    console.log(`Getting companies for user ${userId}: found ${companies.length} companies`);
    console.log('Company details:', companies.map(c => `${c.id} (${c.name}, demo: ${c.isDemo}, owner: ${c.ownerId})`));
    console.log('All companies in storage:', Array.from(this.companies.values()).map(c => `${c.name} (owner: ${c.ownerId}, demo: ${c.isDemo})`));
    return companies;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated = { ...company, ...updates };
    this.companies.set(id, updated);
    return updated;
  }

  // Security Classes
  async createSecurityClass(insertSecurityClass: InsertSecurityClass): Promise<SecurityClass> {
    const id = randomUUID();
    const securityClass: SecurityClass = {
      id,
      companyId: insertSecurityClass.companyId,
      name: insertSecurityClass.name,
      seniorityTier: insertSecurityClass.seniorityTier ?? 0,
      liquidationPreferenceMultiple: insertSecurityClass.liquidationPreferenceMultiple ?? "1.0",
      participating: insertSecurityClass.participating ?? false,
      participationCap: insertSecurityClass.participationCap ?? null,
      dividendRate: insertSecurityClass.dividendRate ?? "0.0",
      dividendType: insertSecurityClass.dividendType ?? "non-cumulative",
      convertToCommonRatio: insertSecurityClass.convertToCommonRatio ?? "1.0",
      votingRights: insertSecurityClass.votingRights ?? "1.0",
      createdAt: new Date(),
    };
    this.securityClasses.set(id, securityClass);
    return securityClass;
  }

  async getSecurityClasses(companyId: string): Promise<SecurityClass[]> {
    return Array.from(this.securityClasses.values()).filter(sc => sc.companyId === companyId);
  }

  async getSecurityClass(id: string): Promise<SecurityClass | undefined> {
    return this.securityClasses.get(id);
  }

  async updateSecurityClass(id: string, updates: Partial<InsertSecurityClass>): Promise<SecurityClass | undefined> {
    const securityClass = this.securityClasses.get(id);
    if (!securityClass) return undefined;
    
    const updated = { ...securityClass, ...updates };
    this.securityClasses.set(id, updated);
    return updated;
  }

  // Stakeholders
  async createStakeholder(insertStakeholder: InsertStakeholder): Promise<Stakeholder> {
    const id = randomUUID();
    const stakeholder: Stakeholder = {
      id,
      companyId: insertStakeholder.companyId,
      type: insertStakeholder.type,
      name: insertStakeholder.name,
      email: insertStakeholder.email ?? null,
      title: insertStakeholder.title ?? null,
      address: insertStakeholder.address ?? null,
      taxFlags: insertStakeholder.taxFlags ?? null,
      createdAt: new Date(),
    };
    this.stakeholders.set(id, stakeholder);
    return stakeholder;
  }

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return Array.from(this.stakeholders.values()).filter(s => s.companyId === companyId);
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    return this.stakeholders.get(id);
  }

  async updateStakeholder(id: string, updates: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    const stakeholder = this.stakeholders.get(id);
    if (!stakeholder) return undefined;
    
    const updated = { ...stakeholder, ...updates };
    this.stakeholders.set(id, updated);
    return updated;
  }

  async deleteStakeholder(id: string): Promise<void> {
    this.stakeholders.delete(id);
  }

  // Share Ledger Entries
  async createShareLedgerEntry(insertEntry: InsertShareLedgerEntry): Promise<ShareLedgerEntry> {
    const id = randomUUID();
    const entry: ShareLedgerEntry = {
      id,
      companyId: insertEntry.companyId,
      holderId: insertEntry.holderId,
      classId: insertEntry.classId,
      quantity: insertEntry.quantity,
      issueDate: insertEntry.issueDate,
      certificateNo: insertEntry.certificateNo ?? null,
      consideration: insertEntry.consideration ?? null,
      considerationType: insertEntry.considerationType ?? "cash",
      sourceTransactionId: insertEntry.sourceTransactionId ?? null,
      createdAt: new Date(),
    };
    this.shareLedgerEntries.set(id, entry);
    return entry;
  }

  async getShareLedgerEntries(companyId: string): Promise<ShareLedgerEntry[]> {
    return Array.from(this.shareLedgerEntries.values()).filter(e => e.companyId === companyId);
  }

  async getShareLedgerEntry(id: string): Promise<ShareLedgerEntry | undefined> {
    return this.shareLedgerEntries.get(id);
  }

  // Equity Awards
  async createEquityAward(insertAward: InsertEquityAward): Promise<EquityAward> {
    const id = randomUUID();
    const award: EquityAward = {
      id,
      companyId: insertAward.companyId,
      holderId: insertAward.holderId,
      type: insertAward.type,
      planId: insertAward.planId ?? null,
      grantDate: insertAward.grantDate,
      strikePrice: insertAward.strikePrice ?? null,
      quantityGranted: insertAward.quantityGranted,
      quantityExercised: insertAward.quantityExercised ?? 0,
      quantityCanceled: insertAward.quantityCanceled ?? 0,
      earlyExerciseAllowed: insertAward.earlyExerciseAllowed ?? false,
      vestingStartDate: insertAward.vestingStartDate,
      vestingEndDate: insertAward.vestingEndDate,
      cliffMonths: insertAward.cliffMonths,
      totalMonths: insertAward.totalMonths,
      accelerationProvisions: insertAward.accelerationProvisions ?? null,
      iso100kLimitTracking: insertAward.iso100kLimitTracking ?? false,
      createdAt: new Date(),
    };
    this.equityAwards.set(id, award);
    return award;
  }

  async getEquityAwards(companyId: string): Promise<EquityAward[]> {
    return Array.from(this.equityAwards.values()).filter(a => a.companyId === companyId);
  }

  async getEquityAward(id: string): Promise<EquityAward | undefined> {
    return this.equityAwards.get(id);
  }

  async updateEquityAward(id: string, updates: Partial<InsertEquityAward>): Promise<EquityAward | undefined> {
    const award = this.equityAwards.get(id);
    if (!award) return undefined;
    
    const updated = { ...award, ...updates };
    this.equityAwards.set(id, updated);
    return updated;
  }

  // Convertible Instruments
  async createConvertibleInstrument(insertInstrument: InsertConvertibleInstrument): Promise<ConvertibleInstrument> {
    const id = randomUUID();
    const instrument: ConvertibleInstrument = {
      id,
      companyId: insertInstrument.companyId,
      holderId: insertInstrument.holderId,
      type: insertInstrument.type,
      framework: insertInstrument.framework,
      issueDate: insertInstrument.issueDate,
      principal: insertInstrument.principal ?? null,
      interestRate: insertInstrument.interestRate ?? null,
      compounding: insertInstrument.compounding ?? null,
      maturityDate: insertInstrument.maturityDate ?? null,
      discountRate: insertInstrument.discountRate ?? null,
      valuationCap: insertInstrument.valuationCap ?? null,
      nextRoundConversionRights: insertInstrument.nextRoundConversionRights ?? null,
      liquidityConversionRights: insertInstrument.liquidityConversionRights ?? null,
      liquidityRank: insertInstrument.liquidityRank ?? null,
      postMoney: insertInstrument.postMoney ?? false,
      createdAt: new Date(),
    };
    this.convertibleInstruments.set(id, instrument);
    return instrument;
  }

  async getConvertibleInstruments(companyId: string): Promise<ConvertibleInstrument[]> {
    return Array.from(this.convertibleInstruments.values()).filter(i => i.companyId === companyId);
  }

  async getConvertibleInstrument(id: string): Promise<ConvertibleInstrument | undefined> {
    return this.convertibleInstruments.get(id);
  }

  // Rounds
  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = randomUUID();
    const round: Round = {
      id,
      companyId: insertRound.companyId,
      name: insertRound.name,
      closeDate: insertRound.closeDate,
      preMoneyValuation: insertRound.preMoneyValuation ?? null,
      raiseAmount: insertRound.raiseAmount,
      pricePerShare: insertRound.pricePerShare ?? null,
      newSecurityClassId: insertRound.newSecurityClassId ?? null,
      roundType: insertRound.roundType,
      optionPoolIncrease: insertRound.optionPoolIncrease ?? null,
      optionPoolTiming: insertRound.optionPoolTiming ?? null,
      antiDilutionProvisions: insertRound.antiDilutionProvisions ?? null,
      payToPlay: insertRound.payToPlay ?? false,
      createdAt: new Date(),
    };
    this.rounds.set(id, round);
    return round;
  }

  async getRounds(companyId: string): Promise<Round[]> {
    return Array.from(this.rounds.values()).filter(r => r.companyId === companyId);
  }

  async getRound(id: string): Promise<Round | undefined> {
    return this.rounds.get(id);
  }

  // Corporate Actions
  async createCorporateAction(insertAction: InsertCorporateAction): Promise<CorporateAction> {
    const id = randomUUID();
    const action: CorporateAction = {
      id,
      companyId: insertAction.companyId,
      type: insertAction.type,
      ratio: insertAction.ratio,
      effectiveDate: insertAction.effectiveDate,
      affectedClasses: insertAction.affectedClasses ?? null,
      roundingPolicy: insertAction.roundingPolicy ?? "round-down",
      createdAt: new Date(),
    };
    this.corporateActions.set(id, action);
    return action;
  }

  async getCorporateActions(companyId: string): Promise<CorporateAction[]> {
    return Array.from(this.corporateActions.values()).filter(a => a.companyId === companyId);
  }

  // Audit Logs
  async createAuditLog(insertLog: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      createdAt: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(companyId: string, options?: { cursor?: string; limit?: number; event?: string; resourceType?: string; actorId?: string; from?: Date; to?: Date }): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values()).filter(l => l.companyId === companyId);
    
    // Apply filters
    if (options?.event) {
      logs = logs.filter(l => l.event === options.event);
    }
    if (options?.resourceType) {
      logs = logs.filter(l => l.resourceType === options.resourceType);
    }
    if (options?.actorId) {
      logs = logs.filter(l => l.actorId === options.actorId);
    }
    if (options?.from) {
      logs = logs.filter(l => l.createdAt >= options.from!);
    }
    if (options?.to) {
      logs = logs.filter(l => l.createdAt <= options.to!);
    }
    
    // Sort by created date descending
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply cursor pagination
    if (options?.cursor) {
      const cursorIndex = logs.findIndex(l => l.id === options.cursor);
      if (cursorIndex >= 0) {
        logs = logs.slice(cursorIndex + 1);
      }
    }
    
    // Apply limit
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs;
  }

  // Scenarios
  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const id = randomUUID();
    const scenario: Scenario = {
      id,
      companyId: insertScenario.companyId,
      name: insertScenario.name,
      description: insertScenario.description ?? null,
      roundAmount: insertScenario.roundAmount,
      premoney: insertScenario.premoney,
      investors: insertScenario.investors,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async getScenarios(companyId: string): Promise<Scenario[]> {
    return Array.from(this.scenarios.values()).filter(s => s.companyId === companyId);
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async updateScenario(id: string, updates: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    
    const updated = { ...scenario, ...updates, updatedAt: new Date() };
    this.scenarios.set(id, updated);
    return updated;
  }

  async deleteScenario(id: string): Promise<void> {
    this.scenarios.delete(id);
  }

  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      profileImage: insertUser.profileImage ?? null,
      emailVerified: insertUser.emailVerified ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // User Company Access
  async createUserCompanyAccess(insertAccess: InsertUserCompanyAccess): Promise<UserCompanyAccess> {
    const id = randomUUID();
    const access: UserCompanyAccess = {
      id,
      userId: insertAccess.userId,
      companyId: insertAccess.companyId,
      role: insertAccess.role ?? "viewer",
      permissions: insertAccess.permissions ?? null,
      invitedBy: insertAccess.invitedBy ?? null,
      invitedAt: insertAccess.invitedAt ?? null,
      acceptedAt: insertAccess.acceptedAt ?? null,
      createdAt: new Date(),
    };
    this.userCompanyAccess.set(id, access);
    return access;
  }

  async getUserCompanyAccess(userId: string, companyId: string): Promise<UserCompanyAccess | undefined> {
    return Array.from(this.userCompanyAccess.values()).find(
      a => a.userId === userId && a.companyId === companyId
    );
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    // First try to get companies by ownership
    const ownedCompanies = Array.from(this.companies.values()).filter(c => c.ownerId === userId);
    
    // Then add companies with explicit access
    const userAccess = Array.from(this.userCompanyAccess.values()).filter(a => a.userId === userId);
    const accessCompanyIds = userAccess.map(a => a.companyId);
    const accessCompanies = Array.from(this.companies.values()).filter(c => accessCompanyIds.includes(c.id));
    
    // Combine and deduplicate
    const allCompanies = [...ownedCompanies, ...accessCompanies];
    const uniqueCompanies = allCompanies.filter((company, index, self) => 
      index === self.findIndex(c => c.id === company.id)
    );
    
    console.log(`getUserCompanies for ${userId}: owned=${ownedCompanies.length}, access=${accessCompanies.length}, total=${uniqueCompanies.length}`);
    console.log('Company details:', uniqueCompanies.map(c => `${c.name} (demo: ${c.isDemo})`));
    console.log('ALL companies in storage:', Array.from(this.companies.values()).map(c => `${c.name} owner=${c.ownerId} demo=${c.isDemo}`));
    
    return uniqueCompanies;
  }

  async getCompanyUsers(companyId: string): Promise<UserCompanyAccess[]> {
    return Array.from(this.userCompanyAccess.values()).filter(a => a.companyId === companyId);
  }

  // Cap Table Sharing
  async createCapTableShare(insertShare: InsertCapTableShare): Promise<CapTableShare> {
    const id = randomUUID();
    const shareToken = randomUUID();
    const share: CapTableShare = {
      id,
      companyId: insertShare.companyId,
      shareToken,
      createdBy: insertShare.createdBy,
      title: insertShare.title,
      description: insertShare.description ?? null,
      permissions: insertShare.permissions ?? null,
      expiresAt: insertShare.expiresAt ?? null,
      isActive: insertShare.isActive ?? true,
      viewCount: 0,
      lastAccessed: null,
      createdAt: new Date(),
    };
    this.capTableShares.set(id, share);
    return share;
  }

  async getCapTableShare(token: string): Promise<CapTableShare | undefined> {
    return Array.from(this.capTableShares.values()).find(s => s.shareToken === token);
  }

  async getCapTableShares(companyId: string): Promise<CapTableShare[]> {
    return Array.from(this.capTableShares.values()).filter(s => s.companyId === companyId);
  }

  async updateCapTableShare(id: string, updates: Partial<InsertCapTableShare>): Promise<CapTableShare | undefined> {
    const share = this.capTableShares.get(id);
    if (!share) return undefined;
    
    const updated = { ...share, ...updates };
    this.capTableShares.set(id, updated);
    return updated;
  }

  async deleteCapTableShare(id: string): Promise<void> {
    this.capTableShares.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Companies
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return company;
  }

  // Security Classes
  async createSecurityClass(insertSecurityClass: InsertSecurityClass): Promise<SecurityClass> {
    const [securityClass] = await db.insert(securityClasses).values(insertSecurityClass).returning();
    return securityClass;
  }

  async getSecurityClasses(companyId: string): Promise<SecurityClass[]> {
    return await db.select().from(securityClasses).where(eq(securityClasses.companyId, companyId));
  }

  async getSecurityClass(id: string): Promise<SecurityClass | undefined> {
    const [securityClass] = await db.select().from(securityClasses).where(eq(securityClasses.id, id));
    return securityClass;
  }

  async updateSecurityClass(id: string, updates: Partial<InsertSecurityClass>): Promise<SecurityClass | undefined> {
    const [securityClass] = await db.update(securityClasses).set(updates).where(eq(securityClasses.id, id)).returning();
    return securityClass;
  }

  // Stakeholders
  async createStakeholder(insertStakeholder: InsertStakeholder): Promise<Stakeholder> {
    const [stakeholder] = await db.insert(stakeholders).values(insertStakeholder).returning();
    return stakeholder;
  }

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return await db.select().from(stakeholders).where(eq(stakeholders.companyId, companyId));
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    const [stakeholder] = await db.select().from(stakeholders).where(eq(stakeholders.id, id));
    return stakeholder;
  }

  async updateStakeholder(id: string, updates: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    const [stakeholder] = await db.update(stakeholders).set(updates).where(eq(stakeholders.id, id)).returning();
    return stakeholder;
  }

  async deleteStakeholder(id: string): Promise<void> {
    await db.delete(stakeholders).where(eq(stakeholders.id, id));
  }

  // Share Ledger Entries
  async createShareLedgerEntry(insertEntry: InsertShareLedgerEntry): Promise<ShareLedgerEntry> {
    const [entry] = await db.insert(shareLedgerEntries).values(insertEntry).returning();
    return entry;
  }

  async getShareLedgerEntries(companyId: string): Promise<ShareLedgerEntry[]> {
    return await db.select().from(shareLedgerEntries).where(eq(shareLedgerEntries.companyId, companyId));
  }

  async getShareLedgerEntry(id: string): Promise<ShareLedgerEntry | undefined> {
    const [entry] = await db.select().from(shareLedgerEntries).where(eq(shareLedgerEntries.id, id));
    return entry;
  }

  // Equity Awards
  async createEquityAward(insertAward: InsertEquityAward): Promise<EquityAward> {
    const [award] = await db.insert(equityAwards).values(insertAward).returning();
    return award;
  }

  async getEquityAwards(companyId: string): Promise<EquityAward[]> {
    return await db.select().from(equityAwards).where(eq(equityAwards.companyId, companyId));
  }

  async getEquityAward(id: string): Promise<EquityAward | undefined> {
    const [award] = await db.select().from(equityAwards).where(eq(equityAwards.id, id));
    return award;
  }

  async updateEquityAward(id: string, updates: Partial<InsertEquityAward>): Promise<EquityAward | undefined> {
    const [award] = await db.update(equityAwards).set(updates).where(eq(equityAwards.id, id)).returning();
    return award;
  }

  // Convertible Instruments
  async createConvertibleInstrument(insertInstrument: InsertConvertibleInstrument): Promise<ConvertibleInstrument> {
    const [instrument] = await db.insert(convertibleInstruments).values(insertInstrument).returning();
    return instrument;
  }

  async getConvertibleInstruments(companyId: string): Promise<ConvertibleInstrument[]> {
    return await db.select().from(convertibleInstruments).where(eq(convertibleInstruments.companyId, companyId));
  }

  async getConvertibleInstrument(id: string): Promise<ConvertibleInstrument | undefined> {
    const [instrument] = await db.select().from(convertibleInstruments).where(eq(convertibleInstruments.id, id));
    return instrument;
  }

  // Rounds
  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async getRounds(companyId: string): Promise<Round[]> {
    return await db.select().from(rounds).where(eq(rounds.companyId, companyId));
  }

  async getRound(id: string): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round;
  }

  // Corporate Actions
  async createCorporateAction(insertAction: InsertCorporateAction): Promise<CorporateAction> {
    const [action] = await db.insert(corporateActions).values(insertAction).returning();
    return action;
  }

  async getCorporateActions(companyId: string): Promise<CorporateAction[]> {
    return await db.select().from(corporateActions).where(eq(corporateActions.companyId, companyId));
  }

  // Audit Logs
  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values({
      ...log,
      id: randomUUID(),
      createdAt: new Date()
    }).returning();
    return auditLog;
  }

  async getAuditLogs(companyId: string, options?: { cursor?: string; limit?: number; event?: string; resourceType?: string; actorId?: string; from?: Date; to?: Date }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs).where(eq(auditLogs.companyId, companyId));
    
    // Apply filters would need more complex Drizzle queries - for now just basic filtering
    // In a real implementation, you'd build the query with conditional where clauses
    
    const result = await query;
    let logs = result;
    
    // Apply client-side filtering for now (in production, this should be done in the database)
    if (options?.event) {
      logs = logs.filter(l => l.event === options.event);
    }
    if (options?.resourceType) {
      logs = logs.filter(l => l.resourceType === options.resourceType);
    }
    if (options?.actorId) {
      logs = logs.filter(l => l.actorId === options.actorId);
    }
    if (options?.from) {
      logs = logs.filter(l => l.createdAt >= options.from!);
    }
    if (options?.to) {
      logs = logs.filter(l => l.createdAt <= options.to!);
    }
    
    // Sort by created date descending
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply cursor pagination
    if (options?.cursor) {
      const cursorIndex = logs.findIndex(l => l.id === options.cursor);
      if (cursorIndex >= 0) {
        logs = logs.slice(cursorIndex + 1);
      }
    }
    
    // Apply limit
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs;
  }

  // Scenarios
  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const [scenario] = await db.insert(scenarios).values(insertScenario).returning();
    return scenario;
  }

  async getScenarios(companyId: string): Promise<Scenario[]> {
    return await db.select().from(scenarios).where(eq(scenarios.companyId, companyId));
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async updateScenario(id: string, updates: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const [scenario] = await db.update(scenarios).set(updates).where(eq(scenarios.id, id)).returning();
    return scenario;
  }

  async deleteScenario(id: string): Promise<void> {
    await db.delete(scenarios).where(eq(scenarios.id, id));
  }

  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // User Company Access
  async createUserCompanyAccess(insertAccess: InsertUserCompanyAccess): Promise<UserCompanyAccess> {
    const [access] = await db.insert(userCompanyAccess).values(insertAccess).returning();
    return access;
  }

  async getUserCompanyAccess(userId: string, companyId: string): Promise<UserCompanyAccess | undefined> {
    const [access] = await db.select()
      .from(userCompanyAccess)
      .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.companyId, companyId)));
    return access;
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const result = await db.select({
      company: companies
    })
    .from(userCompanyAccess)
    .innerJoin(companies, eq(userCompanyAccess.companyId, companies.id))
    .where(eq(userCompanyAccess.userId, userId));
    
    return result.map(row => row.company);
  }

  async getCompanyUsers(companyId: string): Promise<UserCompanyAccess[]> {
    return await db.select().from(userCompanyAccess).where(eq(userCompanyAccess.companyId, companyId));
  }

  // Cap Table Sharing
  async createCapTableShare(insertShare: InsertCapTableShare): Promise<CapTableShare> {
    const [share] = await db.insert(capTableShares).values(insertShare).returning();
    return share;
  }

  async getCapTableShare(token: string): Promise<CapTableShare | undefined> {
    const [share] = await db.select().from(capTableShares).where(eq(capTableShares.shareToken, token));
    return share;
  }

  async updateCapTableShare(id: string, updates: Partial<InsertCapTableShare>): Promise<CapTableShare | undefined> {
    const [share] = await db.update(capTableShares).set(updates).where(eq(capTableShares.id, id)).returning();
    return share;
  }

  async deleteCapTableShare(id: string): Promise<void> {
    await db.delete(capTableShares).where(eq(capTableShares.id, id));
  }
}

export const storage = new DatabaseStorage();
