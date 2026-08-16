import { db } from "~/utils/db.server";
import type { SessionUser } from "./auth.server";

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
}

export enum SessionRevocationReason {
  USER_REQUESTED = "USER_REQUESTED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  ACCOUNT_BLOCKED = "ACCOUNT_BLOCKED",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  SECURITY_CONCERN = "SECURITY_CONCERN",
  ADMIN_ACTION = "ADMIN_ACTION",
  EXPIRED = "EXPIRED",
}

/**
 * Creates a new session record in the database
 */
export async function createSessionRecord({
  userId,
  token,
  userAgent,
  ipAddress,
  deviceFingerprint,
  expiresAt,
}: {
  userId: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
  expiresAt: Date;
}): Promise<void> {
  await db.session.create({
    data: {
      userId,
      token,
      userAgent,
      ipAddress,
      deviceFingerprint,
      expiresAt,
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Updates the last activity timestamp for a session
 */
export async function updateSessionActivity(token: string): Promise<void> {
  await db.session.updateMany({
    where: {
      token,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Validates a session token against the database
 * Returns null if session is invalid, revoked, or expired
 */
export async function validateSessionToken(
  token: string
): Promise<{ userId: string; sessionId: string } | null> {
  const session = await db.session.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    return null;
  }

  return {
    userId: session.userId,
    sessionId: session.id,
  };
}

/**
 * Revokes a single session by token
 */
export async function revokeSession(
  token: string,
  reason: SessionRevocationReason = SessionRevocationReason.USER_REQUESTED
): Promise<boolean> {
  const result = await db.session.updateMany({
    where: {
      token,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count > 0;
}

/**
 * Revokes all sessions for a user
 */
export async function revokeAllUserSessions(
  userId: string,
  reason: SessionRevocationReason = SessionRevocationReason.USER_REQUESTED,
  excludeToken?: string
): Promise<number> {
  const where: {
    userId: string;
    revokedAt: null;
    token?: { not?: string };
  } = {
    userId,
    revokedAt: null,
  };

  if (excludeToken) {
    where.token = { not: excludeToken };
  }

  const result = await db.session.updateMany({
    where,
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count;
}

/**
 * Revokes a specific session by ID
 */
export async function revokeSessionById(
  sessionId: string,
  reason: SessionRevocationReason = SessionRevocationReason.USER_REQUESTED
): Promise<boolean> {
  const result = await db.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count > 0;
}

/**
 * Gets all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return db.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      deviceFingerprint: true,
      createdAt: true,
      lastActiveAt: true,
      expiresAt: true,
    },
    orderBy: {
      lastActiveAt: "desc",
    },
  });
}

/**
 * Gets session metadata by token
 */
export async function getSessionMetadata(token: string) {
  return db.session.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      userAgent: true,
      ipAddress: true,
      deviceFingerprint: true,
      createdAt: true,
      lastActiveAt: true,
      expiresAt: true,
      revokedAt: true,
      revokedReason: true,
    },
  });
}

/**
 * Checks if a user's account status allows authentication
 */
export async function checkAccountStatus(userId: string): Promise<{
  allowed: boolean;
  status?: string;
  reason?: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      accountStatus: true,
      deletedAt: true,
    },
  });

  if (!user) {
    return { allowed: false, status: "NOT_FOUND", reason: "User not found" };
  }

  if (user.deletedAt) {
    return { allowed: false, status: "DELETED", reason: "Account has been deleted" };
  }

  switch (user.accountStatus) {
    case "ACTIVE":
      return { allowed: true };
    case "BLOCKED":
      return { 
        allowed: false, 
        status: "BLOCKED", 
        reason: "Your account has been blocked. Please contact support." 
      };
    case "SUSPENDED":
      return { 
        allowed: false, 
        status: "SUSPENDED", 
        reason: "Your account has been temporarily suspended." 
      };
    case "PENDING_VERIFICATION":
      return { 
        allowed: false, 
        status: "PENDING_VERIFICATION", 
        reason: "Please verify your email to continue." 
      };
    default:
      return { 
        allowed: false, 
        status: "UNKNOWN", 
        reason: "Unknown account status" 
      };
  }
}

/**
 * Updates user account status
 */
export async function updateUserAccountStatus(
  userId: string,
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED" | "PENDING_VERIFICATION",
  revokeSessions: boolean = true,
  reason?: SessionRevocationReason
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { accountStatus: status },
  });

  if (revokeSessions && status !== "ACTIVE") {
    const revocationReason = reason ?? 
      (status === "BLOCKED" ? SessionRevocationReason.ACCOUNT_BLOCKED :
       status === "SUSPENDED" ? SessionRevocationReason.ACCOUNT_SUSPENDED :
       SessionRevocationReason.SECURITY_CONCERN);
    
    await revokeAllUserSessions(userId, revocationReason);
  }
}

/**
 * Cleans up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { 
          AND: [
            { revokedAt: { not: null } },
            { revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
          ]
        }
      ],
    },
  });

  return result.count;
}

/**
 * Middleware helper to validate session and account status
 */
export async function validateSessionAndAccountStatus(
  token: string
): Promise<{
  valid: boolean;
  user?: SessionUser;
  reason?: string;
  status?: string;
}> {
  const session = await validateSessionToken(token);
  
  if (!session) {
    return { valid: false, reason: "Session invalid or expired" };
  }

  const statusCheck = await checkAccountStatus(session.userId);
  
  if (!statusCheck.allowed) {
    // Revoke session if account is not active
    if (statusCheck.status !== "NOT_FOUND") {
      await revokeSession(token, SessionRevocationReason.ACCOUNT_BLOCKED);
    }
    return { 
      valid: false, 
      reason: statusCheck.reason,
      status: statusCheck.status 
    };
  }

  // Update last activity
  await updateSessionActivity(token).catch(() => {
    // Silently fail on activity update
  });

  return { valid: true };
}
