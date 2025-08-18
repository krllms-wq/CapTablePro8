import { 
  type Company, type InsertCompany,
  type SecurityClass, type InsertSecurityClass,
  type Stakeholder, type InsertStakeholder,
  type ShareLedgerEntry, type InsertShareLedgerEntry,
  type EquityAward, type InsertEquityAward,
  type ConvertibleInstrument, type InsertConvertibleInstrument,
  type Round, type InsertRound,
  type CorporateAction, type InsertCorporateAction,
  type AuditLog
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
  getAuditLogs(companyId: string): Promise<AuditLog[]>;
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

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create a sample company
    const companyId = randomUUID();
    const company: Company = {
      id: companyId,
      name: "TechStart Inc.",
      description: "Series A SaaS Startup • Delaware C-Corp",
      country: "US",
      currency: "USD",
      parValue: "0.0001",
      incorporationDate: new Date("2022-01-15"),
      authorizedShares: 15000000,
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
      currency: insertCompany.currency ?? "USD", 
      parValue: insertCompany.parValue ?? "0.0001",
      incorporationDate: insertCompany.incorporationDate,
      authorizedShares: insertCompany.authorizedShares ?? 10000000,
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
  async createAuditLog(insertLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(companyId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(l => l.companyId === companyId);
  }
}

export const storage = new MemStorage();
