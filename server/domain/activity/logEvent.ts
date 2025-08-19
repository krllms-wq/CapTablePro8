import { storage } from "../../storage";

export interface LogEventParams {
  companyId: string;
  actorId?: string;
  event: string;
  resourceType: "user" | "stakeholder" | "transaction" | "company";
  resourceId?: string;
  metadata?: Record<string, any>;
}

export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    await storage.createAuditLog({
      companyId: params.companyId,
      actorId: params.actorId || null,
      event: params.event,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error("Failed to log event:", error);
    // Don't throw - audit logging failures shouldn't break main functionality
  }
}

// Helper functions for common event types
export async function logStakeholderEvent(params: {
  companyId: string;
  actorId?: string;
  event: "stakeholder.created" | "stakeholder.updated" | "stakeholder.deleted";
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType?: string;
  changes?: Record<string, any>;
}) {
  await logEvent({
    companyId: params.companyId,
    actorId: params.actorId,
    event: params.event,
    resourceType: "stakeholder",
    resourceId: params.stakeholderId,
    metadata: {
      stakeholderName: params.stakeholderName,
      stakeholderType: params.stakeholderType,
      changes: params.changes,
    },
  });
}

export async function logTransactionEvent(params: {
  companyId: string;
  actorId?: string;
  event: "transaction.shares_issued" | "transaction.options_granted" | "transaction.safe_created" | "transaction.convertible_created" | "transaction.secondary_transfer";
  transactionId: string;
  stakeholderName?: string;
  details: Record<string, any>;
}) {
  await logEvent({
    companyId: params.companyId,
    actorId: params.actorId,
    event: params.event,
    resourceType: "transaction",
    resourceId: params.transactionId,
    metadata: {
      stakeholderName: params.stakeholderName,
      ...params.details,
    },
  });
}

export async function logCompanyEvent(params: {
  companyId: string;
  actorId?: string;
  event: "company.updated" | "company.created";
  changes?: Record<string, any>;
}) {
  await logEvent({
    companyId: params.companyId,
    actorId: params.actorId,
    event: params.event,
    resourceType: "company",
    resourceId: params.companyId,
    metadata: {
      changedFields: params.changes,
    },
  });
}

export async function logUserEvent(params: {
  companyId: string;
  actorId?: string;
  event: "user.invited" | "user.created" | "user.access_granted";
  userId: string;
  userEmail?: string;
  role?: string;
}) {
  await logEvent({
    companyId: params.companyId,
    actorId: params.actorId,
    event: params.event,
    resourceType: "user",
    resourceId: params.userId,
    metadata: {
      userEmail: params.userEmail,
      role: params.role,
    },
  });
}