import { db } from "~/utils/db.server";
import { buildSignedWebhookHeaders } from "~/utils/webhook-signing.server";

const MENTION_REGEX = /(^|[\s(])@([a-z0-9_]{3,30})\b/gi;

export type AppNotificationType =
  | "NEW_FOLLOWER"
  | "STORY_REACTION"
  | "STORY_COMMENT"
  | "ASPIRATION_SUPPORT"
  | "STORY_MILESTONE"
  | "AI_SUGGESTION"
  | "COMMUNITY_UPDATE"
  | "MESSAGE"
  | "MENTION";

type DeliveryPreferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: "realtime" | "daily" | "weekly";
};

type DeliveryPlan = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  digestFrequency: DeliveryPreferences["digestFrequency"];
  emailDeferredToDigest: boolean;
};

const DEFAULT_DELIVERY_PREFERENCES: DeliveryPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  digestFrequency: "daily",
};

const NOTIFICATION_CHANNEL_POLICY: Record<
  AppNotificationType,
  {
    email: boolean;
    push: boolean;
    sms: boolean;
    digestEligible: boolean;
  }
> = {
  NEW_FOLLOWER: {
    email: false,
    push: true,
    sms: false,
    digestEligible: true,
  },
  STORY_REACTION: {
    email: false,
    push: true,
    sms: false,
    digestEligible: true,
  },
  STORY_COMMENT: {
    email: true,
    push: true,
    sms: false,
    digestEligible: false,
  },
  ASPIRATION_SUPPORT: {
    email: true,
    push: true,
    sms: false,
    digestEligible: false,
  },
  STORY_MILESTONE: {
    email: true,
    push: true,
    sms: false,
    digestEligible: false,
  },
  AI_SUGGESTION: {
    email: false,
    push: false,
    sms: false,
    digestEligible: false,
  },
  COMMUNITY_UPDATE: {
    email: true,
    push: true,
    sms: false,
    digestEligible: true,
  },
  MESSAGE: {
    email: true,
    push: true,
    sms: false,
    digestEligible: false,
  },
  MENTION: {
    email: true,
    push: true,
    sms: false,
    digestEligible: false,
  },
};

function normalizeDigestFrequency(input: string | null | undefined): DeliveryPreferences["digestFrequency"] {
  if (input === "realtime" || input === "weekly") {
    return input;
  }

  return "daily";
}

function evaluateDeliveryPlan(type: AppNotificationType, preferences: DeliveryPreferences): DeliveryPlan {
  const policy = NOTIFICATION_CHANNEL_POLICY[type];
  const emailDeferredToDigest =
    policy.digestEligible &&
    policy.email &&
    preferences.digestFrequency !== "realtime";

  return {
    inApp: true,
    email:
      policy.email &&
      preferences.emailNotifications &&
      !emailDeferredToDigest,
    push: policy.push && preferences.pushNotifications,
    sms: policy.sms && preferences.smsNotifications,
    digestFrequency: preferences.digestFrequency,
    emailDeferredToDigest,
  };
}

function getUserPreferenceDelegate() {
  return (db as unknown as {
    userPreference?: {
      findUnique?: (args: unknown) => Promise<
        | {
            userId: string;
            emailNotifications: boolean;
            pushNotifications: boolean;
            smsNotifications: boolean;
            digestFrequency: string;
          }
        | null
      >;
      findMany?: (args: unknown) => Promise<
        Array<{
          userId: string;
          emailNotifications: boolean;
          pushNotifications: boolean;
          smsNotifications: boolean;
          digestFrequency: string;
        }>
      >;
    };
  }).userPreference;
}

function toDeliveryPreferences(record: {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: string;
} | null | undefined): DeliveryPreferences {
  if (!record) {
    return { ...DEFAULT_DELIVERY_PREFERENCES };
  }

  return {
    emailNotifications: Boolean(record.emailNotifications),
    pushNotifications: Boolean(record.pushNotifications),
    smsNotifications: Boolean(record.smsNotifications),
    digestFrequency: normalizeDigestFrequency(record.digestFrequency),
  };
}

async function getDeliveryPreferencesForUsers(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, DeliveryPreferences>();

  if (uniqueIds.length === 0) {
    return map;
  }

  const preferenceDelegate = getUserPreferenceDelegate();

  if (!preferenceDelegate) {
    for (const userId of uniqueIds) {
      map.set(userId, { ...DEFAULT_DELIVERY_PREFERENCES });
    }
    return map;
  }

  if (preferenceDelegate.findMany) {
    try {
      const rows = await preferenceDelegate.findMany({
        where: {
          userId: {
            in: uniqueIds,
          },
        },
        select: {
          userId: true,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: true,
          digestFrequency: true,
        },
      });

      for (const row of rows) {
        map.set(row.userId, toDeliveryPreferences(row));
      }
    } catch {
      // Fallback to defaults during compatibility windows.
    }
  }

  if (preferenceDelegate.findUnique) {
    const unresolvedIds = uniqueIds.filter((userId) => !map.has(userId));
    if (unresolvedIds.length > 0) {
      await Promise.all(
        unresolvedIds.map(async (userId) => {
          try {
            const row = await preferenceDelegate.findUnique({
              where: { userId },
              select: {
                userId: true,
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: true,
                digestFrequency: true,
              },
            });

            map.set(userId, toDeliveryPreferences(row));
          } catch {
            map.set(userId, { ...DEFAULT_DELIVERY_PREFERENCES });
          }
        }),
      );
    }
  }

  for (const userId of uniqueIds) {
    if (!map.has(userId)) {
      map.set(userId, { ...DEFAULT_DELIVERY_PREFERENCES });
    }
  }

  return map;
}

function withDeliveryMetadata(
  data: Record<string, unknown> | null | undefined,
  plan: DeliveryPlan,
) {
  return {
    ...(data ?? {}),
    delivery: {
      inApp: plan.inApp,
      emailEligible: plan.email,
      pushEligible: plan.push,
      smsEligible: plan.sms,
      digestFrequency: plan.digestFrequency,
      emailDeferredToDigest: plan.emailDeferredToDigest,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

function getNotificationDeliveryWebhookConfig() {
  const url = process.env.NOTIFICATION_DELIVERY_WEBHOOK_URL?.trim();
  if (!url) {
    return null;
  }

  return {
    url,
    secret: process.env.NOTIFICATION_DELIVERY_WEBHOOK_SECRET?.trim(),
    keyId: process.env.NOTIFICATION_DELIVERY_WEBHOOK_KEY_ID?.trim(),
  };
}

async function dispatchNotificationDeliveryWebhook(input: {
  notificationId: string;
  userId: string;
  actorId?: string | null;
  type: AppNotificationType;
  title: string;
  body?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  plan: DeliveryPlan;
  data?: Record<string, unknown> | null;
}) {
  const config = getNotificationDeliveryWebhookConfig();
  if (!config) {
    return;
  }

  const channels = [
    input.plan.email ? "email" : null,
    input.plan.push ? "push" : null,
    input.plan.sms ? "sms" : null,
  ].filter(Boolean);

  if (channels.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    notificationId: input.notificationId,
    userId: input.userId,
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    resourceId: input.resourceId ?? null,
    resourceType: input.resourceType ?? null,
    channels,
    plan: input.plan,
    data: input.data ?? {},
  });

  try {
    const headers = config.secret
      ? buildSignedWebhookHeaders({
          body: payload,
          secret: config.secret,
          event: `notification.${input.type.toLowerCase()}`,
          source: "notification-delivery",
          keyId: config.keyId,
        })
      : new Headers({
          "Content-Type": "application/json",
          "X-PaTan-Webhook-Source": "notification-delivery",
          "X-PaTan-Webhook-Event": `notification.${input.type.toLowerCase()}`,
        });

    await fetch(config.url, {
      method: "POST",
      headers,
      body: payload,
    });
  } catch {
    // Best-effort only, in-app persistence has already succeeded.
  }
}

export function extractMentionedUsernames(input: string) {
  const usernames = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(input)) !== null) {
    usernames.add(match[2].toLowerCase());
  }

  return Array.from(usernames);
}

export async function resolveMentionedUsers(
  input: string,
  excludeUserIds: string[] = [],
) {
  const usernames = extractMentionedUsernames(input);

  if (usernames.length === 0) {
    return [];
  }

  return db.user.findMany({
    where: {
      deletedAt: null,
      OR: usernames.map((username) => ({
        username: {
          equals: username,
          mode: "insensitive",
        },
      })),
      ...(excludeUserIds.length > 0
        ? {
            id: {
              notIn: excludeUserIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });
}

type NotifyOneInput = {
  userId: string;
  actorId?: string | null;
  type: AppNotificationType;
  title: string;
  body?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  data?: Record<string, unknown> | null;
};

export async function createNotification(input: NotifyOneInput) {
  if (input.actorId && input.actorId === input.userId) {
    return null;
  }

  const preferencesMap = await getDeliveryPreferencesForUsers([input.userId]);
  const preferences =
    preferencesMap.get(input.userId) ?? { ...DEFAULT_DELIVERY_PREFERENCES };
  const plan = evaluateDeliveryPlan(input.type, preferences);
  const data = withDeliveryMetadata(input.data, plan);

  try {
    const created = await db.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        resourceId: input.resourceId ?? null,
        resourceType: input.resourceType ?? null,
        data,
      },
    });

    void dispatchNotificationDeliveryWebhook({
      notificationId: created.id,
      userId: created.userId,
      actorId: created.actorId,
      type: input.type,
      title: input.title,
      body: input.body,
      resourceId: input.resourceId,
      resourceType: input.resourceType,
      plan,
      data,
    });

    return created;
  } catch {
    return null;
  }
}

type NotifyManyInput = {
  userIds: string[];
  actorId?: string | null;
  type: AppNotificationType;
  title: string;
  body?: string;
  resourceId?: string;
  resourceType?: string;
  data?: Record<string, unknown>;
  excludeUserIds?: string[];
};

export async function createNotifications(input: NotifyManyInput) {
  const excluded = new Set(input.excludeUserIds ?? []);
  if (input.actorId) {
    excluded.add(input.actorId);
  }

  const recipients = Array.from(new Set(input.userIds)).filter(
    (userId) => userId && !excluded.has(userId),
  );

  if (recipients.length === 0) {
    return { count: 0 };
  }

  const preferencesMap = await getDeliveryPreferencesForUsers(recipients);

  const rows = recipients.map((userId) => {
    const preferences =
      preferencesMap.get(userId) ?? { ...DEFAULT_DELIVERY_PREFERENCES };
    const plan = evaluateDeliveryPlan(input.type, preferences);
    const data = withDeliveryMetadata(input.data, plan);

    return {
      userId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      resourceId: input.resourceId ?? null,
      resourceType: input.resourceType ?? null,
      data,
      _deliveryPlan: plan,
    };
  });

  try {
    const countResult = await db.notification.createMany({
      data: rows.map((row) => ({
        userId: row.userId,
        actorId: row.actorId,
        type: row.type,
        title: row.title,
        body: row.body,
        resourceId: row.resourceId,
        resourceType: row.resourceType,
        data: row.data,
      })),
    });

    for (const row of rows) {
      void dispatchNotificationDeliveryWebhook({
        notificationId: "batch",
        userId: row.userId,
        actorId: row.actorId,
        type: row.type,
        title: row.title,
        body: row.body,
        resourceId: row.resourceId,
        resourceType: row.resourceType,
        plan: row._deliveryPlan,
        data: row.data,
      });
    }

    return countResult;
  } catch {
    return { count: 0 };
  }
}

type MentionNotifyInput = {
  mentionedUserIds: string[];
  actorId: string;
  title: string;
  body?: string;
  resourceId?: string;
  resourceType?: string;
  data?: Record<string, unknown>;
  excludeUserIds?: string[];
};

export async function createMentionNotifications(input: MentionNotifyInput) {
  return createNotifications({
    userIds: input.mentionedUserIds,
    actorId: input.actorId,
    type: "MENTION",
    title: input.title,
    body: input.body,
    resourceId: input.resourceId,
    resourceType: input.resourceType,
    data: input.data,
    excludeUserIds: input.excludeUserIds,
  });
}
