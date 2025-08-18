export type CapTableView = "AsIssued" | "AsConverted" | "FullyDiluted";

export interface FullyDilutedOptions {
  includeUnallocatedPool: boolean;
  includeRSUs: "none" | "granted" | "vested";
  includeWarrants: boolean;
}

export interface CapTableEntry {
  holderId: string;
  holderName: string;
  securityClass: string;
  shares: number;
  ownership: number;
  value: number;
}

export interface CapTableResult {
  entries: CapTableEntry[];
  totalShares: number;
  totalValue: number;
  fullyDilutedShares?: number;
}

export interface ShareLedgerEntry {
  id: string;
  holderId: string;
  classId: string;
  quantity: number;
  issueDate: Date;
  consideration?: number;
}

export interface EquityAward {
  id: string;
  holderId: string;
  type: string;
  quantityGranted: number;
  quantityExercised: number;
  quantityCanceled: number;
  quantityExpired: number;
  grantDate: Date;
  vestingStartDate: Date;
  cliffMonths: number;
  totalMonths: number;
  strikePrice?: number;
}

export interface ConvertibleInstrument {
  id: string;
  holderId: string;
  type: "SAFE" | "NOTE";
  framework: string;
  principal: number;
  issueDate: Date;
  maturityDate?: Date;
  interestRate?: number;
  discountRate?: number;
  valuationCap?: number;
  postMoney: boolean;
}

export interface OptionPlan {
  id: string;
  name: string;
  totalShares: number;
  allocatedShares: number;
  availableShares: number;
  issuedShares: number;
}

export interface SecurityClass {
  id: string;
  name: string;
  liquidationPreferenceMultiple: number;
  participating: boolean;
  votingRights: number;
  seniorityTier: number;
}