import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and Authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// User Company Access
export const userCompanyAccess = pgTable("user_company_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  role: varchar("role", { length: 20 }).notNull().default("viewer"), // owner, admin, viewer, investor
  permissions: jsonb("permissions"), // specific permissions
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Cap Table Sharing
export const capTableShares = pgTable("cap_table_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  shareToken: varchar("share_token").notNull().unique(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  permissions: jsonb("permissions"), // view caps, export rights, etc.
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Companies
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  country: varchar("country", { length: 2 }).notNull().default("US"),
  jurisdiction: text("jurisdiction").notNull().default("Delaware"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  parValue: decimal("par_value", { precision: 10, scale: 4 }).notNull().default("0.0001"),
  incorporationDate: timestamp("incorporation_date").notNull(),
  authorizedShares: integer("authorized_shares").notNull().default(10000000),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  ownerDemoIdx: index("companies_owner_demo_unique").on(table.ownerId, table.isDemo).where(sql`${table.isDemo} = true`),
}));

// Security Classes (Common, Preferred A, B, etc.)
export const securityClasses = pgTable("security_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(), // "Common", "Series A Preferred", etc.
  seniorityTier: integer("seniority_tier").notNull().default(0),
  liquidationPreferenceMultiple: decimal("liquidation_preference_multiple", { precision: 10, scale: 2 }).notNull().default("1.0"),
  participating: boolean("participating").notNull().default(false),
  participationCap: decimal("participation_cap", { precision: 10, scale: 2 }),
  dividendRate: decimal("dividend_rate", { precision: 5, scale: 4 }).notNull().default("0.0"),
  dividendType: varchar("dividend_type", { length: 20 }).notNull().default("non-cumulative"), // cumulative, non-cumulative
  convertToCommonRatio: decimal("convert_to_common_ratio", { precision: 10, scale: 4 }).notNull().default("1.0"),
  votingRights: decimal("voting_rights", { precision: 10, scale: 4 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Stakeholders (People and Entities)
export const stakeholders = pgTable("stakeholders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  type: varchar("type", { length: 10 }).notNull(), // "person", "entity"
  name: text("name").notNull(),
  email: text("email"),
  title: text("title"),
  address: text("address"),
  taxFlags: jsonb("tax_flags"), // ISO eligible, etc.
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Share Ledger Entries
export const shareLedgerEntries = pgTable("share_ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  holderId: varchar("holder_id").notNull().references(() => stakeholders.id),
  classId: varchar("class_id").notNull().references(() => securityClasses.id),
  quantity: integer("quantity").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  certificateNo: text("certificate_no"),
  consideration: decimal("consideration", { precision: 15, scale: 2 }),
  considerationType: varchar("consideration_type", { length: 20 }).notNull().default("cash"), // cash, non-cash
  sourceTransactionId: varchar("source_transaction_id"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Equity Awards (Options, RSUs, etc.)
export const equityAwards = pgTable("equity_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  holderId: varchar("holder_id").notNull().references(() => stakeholders.id),
  type: varchar("type", { length: 20 }).notNull(), // ISO, NSO, RSU, SAR, Phantom
  planId: varchar("plan_id"),
  grantDate: timestamp("grant_date").notNull(),
  strikePrice: decimal("strike_price", { precision: 10, scale: 4 }),
  quantityGranted: integer("quantity_granted").notNull(),
  quantityExercised: integer("quantity_exercised").notNull().default(0),
  quantityCanceled: integer("quantity_canceled").notNull().default(0),
  earlyExerciseAllowed: boolean("early_exercise_allowed").notNull().default(false),
  vestingStartDate: timestamp("vesting_start_date").notNull(),
  cliffMonths: integer("cliff_months").notNull().default(12),
  totalMonths: integer("total_months").notNull().default(48),
  cadence: varchar("cadence", { length: 20 }).notNull().default("monthly"), // monthly, quarterly, annual
  postTerminationExerciseWindowDays: integer("post_termination_exercise_window_days").notNull().default(90),
  iso100kLimitTracking: boolean("iso_100k_limit_tracking").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Convertible Instruments (Notes and SAFEs)
export const convertibleInstruments = pgTable("convertible_instruments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  holderId: varchar("holder_id").notNull().references(() => stakeholders.id),
  type: varchar("type", { length: 10 }).notNull(), // "note", "safe"
  framework: varchar("framework", { length: 50 }).notNull(), // "YC pre-money SAFE", "post-money SAFE", "custom"
  principal: decimal("principal", { precision: 15, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }),
  compounding: varchar("compounding", { length: 20 }).default("simple"), // simple, compounded
  issueDate: timestamp("issue_date").notNull(),
  maturityDate: timestamp("maturity_date"),
  discountRate: decimal("discount_rate", { precision: 5, scale: 4 }),
  valuationCap: decimal("valuation_cap", { precision: 15, scale: 2 }),
  mfn: boolean("mfn").notNull().default(false), // Most Favored Nation
  proRataRights: boolean("pro_rata_rights").notNull().default(false),
  mostFavoredNation: boolean("most_favored_nation").notNull().default(false),
  conversionType: varchar("conversion_type", { length: 30 }).notNull().default("standard"), // shadow_preferred, standard
  targetRoundLink: varchar("target_round_link"),
  postMoney: boolean("post_money").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Financing Rounds
export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(), // "Seed", "Series A", etc.
  closeDate: timestamp("close_date").notNull(),
  preMoneyValuation: decimal("pre_money_valuation", { precision: 15, scale: 2 }),
  raiseAmount: decimal("raise_amount", { precision: 15, scale: 2 }).notNull(),
  pricePerShare: decimal("price_per_share", { precision: 10, scale: 4 }),
  newSecurityClassId: varchar("new_security_class_id").references(() => securityClasses.id),
  roundType: varchar("round_type", { length: 20 }).notNull(), // priced, bridge, secondary, recap
  optionPoolIncrease: decimal("option_pool_increase", { precision: 5, scale: 4 }),
  optionPoolTiming: varchar("option_pool_timing", { length: 20 }), // pre-money, post-money
  antiDilutionProvisions: varchar("anti_dilution_provisions", { length: 30 }), // broad-based, narrow-based, full-ratchet, none
  payToPlay: boolean("pay_to_play").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Corporate Actions
export const corporateActions = pgTable("corporate_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  type: varchar("type", { length: 30 }).notNull(), // stock_split, reverse_split, merger, dividend
  ratio: decimal("ratio", { precision: 10, scale: 4 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  affectedClasses: jsonb("affected_classes"), // Array of class IDs
  roundingPolicy: varchar("rounding_policy", { length: 20 }).notNull().default("bankers"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  actorId: varchar("actor_id"),
  event: text("event").notNull(),
  resourceType: varchar("resource_type", { length: 20 }).notNull(), // user, stakeholder, transaction, company
  resourceId: varchar("resource_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  companyCreatedAtIdx: index("audit_logs_company_created_at_idx").on(table.companyId, table.createdAt.desc()),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
}));

// Scenarios table for saving round modeling scenarios
export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  roundAmount: decimal("round_amount", { precision: 15, scale: 2 }).notNull(),
  premoney: decimal("premoney", { precision: 15, scale: 2 }).notNull(),
  investors: jsonb("investors").notNull(), // Array of investor objects
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
}).extend({
  incorporationDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  jurisdiction: z.string().min(1),
});

export const insertSecurityClassSchema = createInsertSchema(securityClasses).omit({
  id: true,
  createdAt: true,
});

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  createdAt: true,
});

export const insertShareLedgerEntrySchema = createInsertSchema(shareLedgerEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  quantity: z.union([
    z.number(),
    z.string().transform(str => parseInt(str.replace(/,/g, ''), 10))
  ]).pipe(z.number().int().positive()),
  consideration: z.union([
    z.number(),
    z.string().transform(str => parseFloat(str.replace(/,/g, '')))
  ]).pipe(z.number().positive()).optional(),
});

export const insertEquityAwardSchema = createInsertSchema(equityAwards).omit({
  id: true,
  createdAt: true,
}).extend({
  grantDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  vestingStartDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  quantityGranted: z.union([
    z.number(),
    z.string().transform(str => parseInt(str.replace(/,/g, ''), 10))
  ]).pipe(z.number().int().positive()),
  strikePrice: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const cleaned = val.replace(/,/g, '');
        return cleaned === '' ? null : parseFloat(cleaned);
      }
      return val;
    },
    z.number().positive().nullable().optional()
  ),
});

export const insertConvertibleInstrumentSchema = createInsertSchema(convertibleInstruments).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  maturityDate: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
  principal: z.union([
    z.number(),
    z.string().transform(str => parseFloat(str.replace(/,/g, '')))
  ]).pipe(z.number().positive()).optional(),
  valuationCap: z.union([
    z.number(),
    z.string().transform(str => parseFloat(str.replace(/,/g, '')))
  ]).pipe(z.number().positive()).optional(),
  discountRate: z.union([
    z.number(),
    z.string().transform(str => parseFloat(str) / 100) // Convert percentage to decimal
  ]).pipe(z.number().min(0).max(1)).optional(),
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  createdAt: true,
});

export const insertCorporateActionSchema = createInsertSchema(corporateActions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type SecurityClass = typeof securityClasses.$inferSelect;
export type InsertSecurityClass = z.infer<typeof insertSecurityClassSchema>;

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;

export type ShareLedgerEntry = typeof shareLedgerEntries.$inferSelect;
export type InsertShareLedgerEntry = z.infer<typeof insertShareLedgerEntrySchema>;

export type EquityAward = typeof equityAwards.$inferSelect;
export type InsertEquityAward = z.infer<typeof insertEquityAwardSchema>;

export type ConvertibleInstrument = typeof convertibleInstruments.$inferSelect;
export type InsertConvertibleInstrument = z.infer<typeof insertConvertibleInstrumentSchema>;

export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;

export type CorporateAction = typeof corporateActions.$inferSelect;
export type InsertCorporateAction = z.infer<typeof insertCorporateActionSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Company Access schemas
export const insertUserCompanyAccessSchema = createInsertSchema(userCompanyAccess).omit({
  id: true,
  createdAt: true,
});

export type InsertUserCompanyAccess = z.infer<typeof insertUserCompanyAccessSchema>;
export type UserCompanyAccess = typeof userCompanyAccess.$inferSelect;

// Cap Table Share schemas
export const insertCapTableShareSchema = createInsertSchema(capTableShares).omit({
  id: true,
  createdAt: true,
  shareToken: true,
  viewCount: true,
  lastAccessed: true,
});

export type InsertCapTableShare = z.infer<typeof insertCapTableShareSchema>;
export type CapTableShare = typeof capTableShares.$inferSelect;
