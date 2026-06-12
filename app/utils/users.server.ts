import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "~/utils/db.server";
import type { SessionUser } from "~/utils/auth.server";
import type { OAuthProfile } from "~/utils/oauth.server";

type CreateLocalUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type UpdateOnboardingProfileInput = {
  userId: string;
  displayName: string;
  username: string;
  bio?: string;
};

const SCRYPT_KEY_LENGTH = 64;

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

async function generateUniqueUsername(base: string) {
  const normalizedBase = slugifyUsername(base) || "PaTan™user";

  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? normalizedBase : `${normalizedBase}${i}`;
    const existing = await db.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }

  return `${normalizedBase}${Date.now().toString().slice(-6)}`;
}

export function hashLocalPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const salt = parts[1];
  const expectedHex = parts[2];
  const actualHex = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");

  const expectedBuffer = Buffer.from(expectedHex, "hex");
  const actualBuffer = Buffer.from(actualHex, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function toSessionUser(user: {
  id: string;
  email: string | null;
  displayName: string;
  profilePhotoUrl: string | null;
}): SessionUser {
  if (!user.email) {
    throw new Error("user-email-missing");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    avatarUrl: user.profilePhotoUrl ?? undefined,
  };
}

function mapOAuthProviderToAccount(provider: OAuthProfile["provider"]) {
  return provider === "google" ? "GOOGLE" : "FACEBOOK";
}

function getSafeRedirectTarget(redirectTo: string | null | undefined) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }

  return redirectTo;
}

export async function createLocalUser(input: CreateLocalUserInput): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const displayName = `${input.firstName} ${input.lastName}`.trim();

  const existingUser = await db.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (existingUser) {
    throw new Error("email-taken");
  }

  const usernameBase = input.firstName || email.split("@")[0] || "PaTan™user";
  const username = await generateUniqueUsername(usernameBase);

  const created = await db.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash: hashLocalPassword(input.password),
      personalInterests: [],
      accounts: {
        create: {
          provider: "EMAIL",
          providerAccountId: email,
        },
      },
    },
  });

  return {
    ...toSessionUser(created),
    provider: "local",
  };
}

export async function verifyLocalUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<
  | { status: "invalid" }
  | { status: "unverified"; userId: string; email: string }
  | { status: "verified"; user: SessionUser }
> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.user.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
    },
  });

  if (!user || !user.passwordHash) {
    return { status: "invalid" };
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { status: "invalid" };
  }

  if (!user.emailVerified) {
    return {
      status: "unverified",
      userId: user.id,
      email: normalizedEmail,
    };
  }

  return {
    status: "verified",
    user: {
      ...toSessionUser(user),
      provider: "local",
    },
  };
}

export async function upsertOAuthUser(profile: OAuthProfile): Promise<SessionUser> {
  if (!profile.email) {
    throw new Error("oauth-email-missing");
  }

  const provider = mapOAuthProviderToAccount(profile.provider);

  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerUserId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingAccount) {
    const updatedUser = await db.user.update({
      where: { id: existingAccount.userId },
      data: {
        email: profile.email,
        displayName: profile.name,
        profilePhotoUrl: profile.avatarUrl ?? null,
        emailVerified: new Date(),
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return {
      ...toSessionUser(updatedUser),
      provider: profile.provider,
    };
  }

  const existingUser = await db.user.findFirst({
    where: {
      email: profile.email,
      deletedAt: null,
    },
  });

  if (existingUser) {
    await db.account.create({
      data: {
        userId: existingUser.id,
        provider,
        providerAccountId: profile.providerUserId,
      },
    });

    const updatedUser = await db.user.update({
      where: { id: existingUser.id },
      data: {
        displayName: profile.name,
        profilePhotoUrl: profile.avatarUrl ?? existingUser.profilePhotoUrl,
        emailVerified: existingUser.emailVerified ?? new Date(),
        isVerified: true,
        verifiedAt: existingUser.verifiedAt ?? new Date(),
      },
    });

    return {
      ...toSessionUser(updatedUser),
      provider: profile.provider,
    };
  }

  const username = await generateUniqueUsername(profile.email.split("@")[0] || profile.name);

  const createdUser = await db.user.create({
    data: {
      email: profile.email,
      username,
      displayName: profile.name,
      profilePhotoUrl: profile.avatarUrl ?? null,
      emailVerified: new Date(),
      isVerified: true,
      verifiedAt: new Date(),
      personalInterests: [],
      accounts: {
        create: {
          provider,
          providerAccountId: profile.providerUserId,
        },
      },
    },
  });

  return {
    ...toSessionUser(createdUser),
    provider: profile.provider,
  };
}

export async function getPostAuthRedirectForUser(
  userId: string,
  requestedRedirectTo?: string | null,
): Promise<string> {
  const safeRedirectTo = getSafeRedirectTarget(requestedRedirectTo);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  if (!user) {
    return "/login?error=session-expired";
  }

  if (user.onboardingCompleted) {
    return safeRedirectTo;
  }

  return `/onboarding/profile?redirectTo=${encodeURIComponent(safeRedirectTo)}`;
}

export async function getOnboardingProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      personalInterests: true,
      onboardingCompleted: true,
    },
  });
}

export async function updateOnboardingProfileStep(input: UpdateOnboardingProfileInput) {
  const username = input.username.trim().toLowerCase();

  const existingUsername = await db.user.findFirst({
    where: {
      username,
      NOT: {
        id: input.userId,
      },
    },
    select: { id: true },
  });

  if (existingUsername) {
    throw new Error("username-taken");
  }

  return db.user.update({
    where: { id: input.userId },
    data: {
      displayName: input.displayName.trim(),
      username,
      bio: input.bio?.trim() || null,
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
    },
  });
}

export async function completeOnboardingWithInterests(userId: string, interests: string[]) {
  const normalizedInterests = Array.from(
    new Set(
      interests
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);

  return db.user.update({
    where: { id: userId },
    data: {
      personalInterests: normalizedInterests,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      onboardingCompleted: true,
      personalInterests: true,
    },
  });
}

export type ProfileStoryVisibility = "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
export type EngagementRange = "7d" | "30d" | "90d";
export type PublicProfileField = "bio" | "location" | "pronouns" | "interests" | "stories" | "aspirations";
export type PublicProfileVisibilitySettings = Record<PublicProfileField, boolean>;

const PUBLIC_PROFILE_FIELDS: PublicProfileField[] = [
  "bio",
  "location",
  "pronouns",
  "interests",
  "stories",
  "aspirations",
];

const PUBLIC_PROFILE_HIDDEN_PREFIX = "public_profile:hidden:";

const DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS: PublicProfileVisibilitySettings = {
  bio: true,
  location: true,
  pronouns: true,
  interests: true,
  stories: true,
  aspirations: true,
};

type UpdateProfileInput = {
  userId: string;
  bio?: string;
  country?: string;
  city?: string;
  pronouns?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  interests: string[];
};

function normalizeOptionalString(value: string | undefined, maxLength: number) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeInterests(interests: string[]) {
  return Array.from(
    new Set(
      interests
        .map((interest) => interest.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

function normalizePublicProfileVisibilitySettings(
  input: Partial<PublicProfileVisibilitySettings>,
): PublicProfileVisibilitySettings {
  return {
    bio: input.bio ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.bio,
    location: input.location ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.location,
    pronouns: input.pronouns ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.pronouns,
    interests: input.interests ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.interests,
    stories: input.stories ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.stories,
    aspirations: input.aspirations ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS.aspirations,
  };
}

function parsePublicProfileVisibilityFromPreferredCategories(
  preferredCategories: string[] | null | undefined,
): PublicProfileVisibilitySettings {
  const hiddenFields = new Set<PublicProfileField>();

  for (const category of preferredCategories ?? []) {
    if (!category.startsWith(PUBLIC_PROFILE_HIDDEN_PREFIX)) {
      continue;
    }

    const candidate = category.slice(PUBLIC_PROFILE_HIDDEN_PREFIX.length) as PublicProfileField;
    if (PUBLIC_PROFILE_FIELDS.includes(candidate)) {
      hiddenFields.add(candidate);
    }
  }

  const settings = { ...DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS };
  for (const field of PUBLIC_PROFILE_FIELDS) {
    settings[field] = !hiddenFields.has(field);
  }

  return settings;
}

function buildPreferredCategoriesWithProfileVisibility(
  existingCategories: string[] | null | undefined,
  visibilitySettings: PublicProfileVisibilitySettings,
) {
  const preservedCategories = (existingCategories ?? []).filter(
    (category) => !category.startsWith(PUBLIC_PROFILE_HIDDEN_PREFIX),
  );

  const hiddenTokens = PUBLIC_PROFILE_FIELDS
    .filter((field) => !visibilitySettings[field])
    .map((field) => `${PUBLIC_PROFILE_HIDDEN_PREFIX}${field}`);

  return [...preservedCategories, ...hiddenTokens];
}

function getRangeStart(range: EngagementRange) {
  const now = Date.now();

  if (range === "7d") {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }

  if (range === "90d") {
    return new Date(now - 90 * 24 * 60 * 60 * 1000);
  }

  return new Date(now - 30 * 24 * 60 * 60 * 1000);
}

export async function getProfileForEdit(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      country: true,
      city: true,
      pronouns: true,
      profilePhotoUrl: true,
      coverPhotoUrl: true,
      personalInterests: true,
      createdAt: true,
    },
  });
}

export async function updateProfile(input: UpdateProfileInput) {
  return db.user.update({
    where: { id: input.userId },
    data: {
      bio: normalizeOptionalString(input.bio, 240),
      country: normalizeOptionalString(input.country, 60),
      city: normalizeOptionalString(input.city, 60),
      pronouns: normalizeOptionalString(input.pronouns, 40),
      profilePhotoUrl: normalizeOptionalString(input.profilePhotoUrl, 500),
      coverPhotoUrl: normalizeOptionalString(input.coverPhotoUrl, 500),
      personalInterests: normalizeInterests(input.interests),
    },
    select: {
      id: true,
      username: true,
      bio: true,
      country: true,
      city: true,
      pronouns: true,
      profilePhotoUrl: true,
      coverPhotoUrl: true,
      personalInterests: true,
      updatedAt: true,
    },
  });
}

export async function getPublicProfileByUsername(username: string) {
  const normalized = username.trim().toLowerCase();

  const user = await db.user.findFirst({
    where: {
      username: normalized,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      country: true,
      city: true,
      pronouns: true,
      profilePhotoUrl: true,
      coverPhotoUrl: true,
      personalInterests: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [
    storyCount,
    aspirationCount,
    followersCount,
    followingCount,
    recentStories,
    recentAspirations,
    badges,
  ] = await Promise.all([
    db.story.count({
      where: {
        authorId: user.id,
        status: "PUBLISHED",
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
    }),
    db.aspiration.count({
      where: {
        authorId: user.id,
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
    }),
    db.follow.count({ where: { followingId: user.id } }),
    db.follow.count({ where: { followerId: user.id } }),
    db.story.findMany({
      where: {
        authorId: user.id,
        status: "PUBLISHED",
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        reactionCount: true,
        commentCount: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    db.aspiration.findMany({
      where: {
        authorId: user.id,
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        supportCount: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    db.userBadge.findMany({
      where: { userId: user.id },
      select: {
        earnedAt: true,
        badge: {
          select: {
            name: true,
            slug: true,
            iconUrl: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    user,
    stats: {
      storyCount,
      aspirationCount,
      followersCount,
      followingCount,
    },
    recentStories,
    recentAspirations,
    badges,
  };
}

export async function getDashboardSummary(userId: string, range: EngagementRange) {
  const rangeStart = getRangeStart(range);

  const [
    user,
    draftStories,
    publishedStories,
    reactionsReceived,
    aspirationsByStatus,
    recentStories,
    recentAspirations,
    notifications,
    unfinishedDrafts,
    userBadges,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        country: true,
        city: true,
        pronouns: true,
        profilePhotoUrl: true,
        coverPhotoUrl: true,
        personalInterests: true,
        onboardingCompleted: true,
      },
    }),
    db.story.count({
      where: {
        authorId: userId,
        status: "DRAFT",
        deletedAt: null,
      },
    }),
    db.story.count({
      where: {
        authorId: userId,
        status: "PUBLISHED",
        deletedAt: null,
      },
    }),
    db.reaction.count({
      where: {
        story: {
          authorId: userId,
        },
        createdAt: {
          gte: rangeStart,
        },
      },
    }),
    db.aspiration.groupBy({
      by: ["status"],
      where: {
        authorId: userId,
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    }),
    db.story.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.aspiration.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.story.findMany({
      where: {
        authorId: userId,
        status: "DRAFT",
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    db.userBadge.findMany({
      where: { userId },
      select: {
        earnedAt: true,
        badge: {
          select: {
            name: true,
            slug: true,
            iconUrl: true,
            points: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
      take: 6,
    }),
  ]);

  if (!user) {
    return null;
  }

  const aspirationStatusSummary = {
    pending: 0,
    inProgress: 0,
    achieved: 0,
    granted: 0,
    transformed: 0,
  };

  aspirationsByStatus.forEach((group) => {
    if (group.status === "PENDING") {
      aspirationStatusSummary.pending = group._count.status;
    }
    if (group.status === "IN_PROGRESS") {
      aspirationStatusSummary.inProgress = group._count.status;
    }
    if (group.status === "ACHIEVED") {
      aspirationStatusSummary.achieved = group._count.status;
    }
    if (group.status === "GRANTED") {
      aspirationStatusSummary.granted = group._count.status;
    }
    if (group.status === "TRANSFORMED") {
      aspirationStatusSummary.transformed = group._count.status;
    }
  });

  const completionChecklist = [
    Boolean(user.bio?.trim()),
    Boolean(user.country?.trim()),
    Boolean(user.city?.trim()),
    Boolean(user.pronouns?.trim()),
    Boolean(user.profilePhotoUrl?.trim()),
    Boolean(user.coverPhotoUrl?.trim()),
    user.personalInterests.length > 0,
  ];

  const completedFields = completionChecklist.filter(Boolean).length;
  const completionPercent = Math.round((completedFields / completionChecklist.length) * 100);

  return {
    user,
    range,
    profileCompletion: {
      completedFields,
      totalFields: completionChecklist.length,
      percent: completionPercent,
    },
    storyStats: {
      draft: draftStories,
      published: publishedStories,
      reactions: reactionsReceived,
    },
    aspirations: aspirationStatusSummary,
    recentStories,
    recentAspirations,
    notifications,
    unfinishedDrafts,
    badges: userBadges,
  };
}

export async function getSuggestedFollows(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      personalInterests: true,
    },
  });

  if (!user || user.personalInterests.length === 0) {
    return {
      people: [],
      circles: [],
    };
  }

  const [people, circles] = await Promise.all([
    db.user.findMany({
      where: {
        id: {
          not: userId,
        },
        deletedAt: null,
        personalInterests: {
          hasSome: user.personalInterests,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhotoUrl: true,
        personalInterests: true,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.circle.findMany({
      where: {
        deletedAt: null,
        isPrivate: false,
        OR: user.personalInterests.flatMap((interest) => [
          { name: { contains: interest, mode: "insensitive" as const } },
          { description: { contains: interest, mode: "insensitive" as const } },
        ]),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        memberCount: true,
      },
      take: 5,
      orderBy: { memberCount: "desc" },
    }),
  ]);

  const [existingFollows, existingMemberships] = await Promise.all([
    people.length
      ? db.follow.findMany({
          where: {
            followerId: userId,
            followingId: {
              in: people.map((person) => person.id),
            },
          },
          select: {
            followingId: true,
          },
        })
      : Promise.resolve([]),
    circles.length
      ? db.circleMember.findMany({
          where: {
            userId,
            circleId: {
              in: circles.map((circle) => circle.id),
            },
          },
          select: {
            circleId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const followedIds = new Set(existingFollows.map((entry) => entry.followingId));
  const joinedCircleIds = new Set(existingMemberships.map((entry) => entry.circleId));

  return {
    people: people.map((person) => ({
      ...person,
      isFollowing: followedIds.has(person.id),
    })),
    circles: circles.map((circle) => ({
      ...circle,
      isMember: joinedCircleIds.has(circle.id),
    })),
  };
}

type SafetySettingsInput = {
  userId: string;
  anonymousPublishingDefault: boolean;
  defaultStoryVisibility: ProfileStoryVisibility;
  defaultAspirationVisibility: ProfileStoryVisibility;
};

export type NotificationDigestFrequency = "realtime" | "daily" | "weekly";

type NotificationSettingsInput = {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: NotificationDigestFrequency;
};

function isPreferenceSchemaCompatibilityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Prisma P2022 indicates a missing column, common during rolling deploys.
  if (message.includes("p2022") || message.includes("p2021")) {
    return true;
  }

  return (
    (
      message.includes("column") ||
      message.includes("table")
    ) &&
    (
      message.includes("anonymous_publishing_default") ||
      message.includes("default_story_visibility") ||
      message.includes("default_aspiration_visibility") ||
      message.includes("email_notifications") ||
      message.includes("push_notifications") ||
      message.includes("sms_notifications") ||
      message.includes("digest_frequency") ||
      message.includes("preferred_categories") ||
      message.includes("user_preferences")
    )
  );
}

function normalizeDigestFrequency(value: string | null | undefined): NotificationDigestFrequency {
  if (value === "realtime" || value === "weekly") {
    return value;
  }

  return "daily";
}

export async function getNotificationSettings(userId: string) {
  let preferences:
    | {
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        digestFrequency: string;
      }
    | null = null;

  try {
    preferences = await db.userPreference.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        digestFrequency: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }
  }

  if (!preferences) {
    return {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      digestFrequency: "daily" as NotificationDigestFrequency,
    };
  }

  return {
    emailNotifications: Boolean(preferences.emailNotifications),
    pushNotifications: Boolean(preferences.pushNotifications),
    smsNotifications: Boolean(preferences.smsNotifications),
    digestFrequency: normalizeDigestFrequency(preferences.digestFrequency),
  };
}

export async function upsertNotificationSettings(input: NotificationSettingsInput) {
  try {
    return await db.userPreference.upsert({
      where: {
        userId: input.userId,
      },
      create: {
        userId: input.userId,
        emailNotifications: input.emailNotifications,
        pushNotifications: input.pushNotifications,
        smsNotifications: input.smsNotifications,
        digestFrequency: input.digestFrequency,
        preferredCategories: [],
        emotionalTonePreference: [],
        followedTags: [],
        blockedTags: [],
      },
      update: {
        emailNotifications: input.emailNotifications,
        pushNotifications: input.pushNotifications,
        smsNotifications: input.smsNotifications,
        digestFrequency: input.digestFrequency,
      },
      select: {
        userId: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        digestFrequency: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }

    return {
      userId: input.userId,
      emailNotifications: input.emailNotifications,
      pushNotifications: input.pushNotifications,
      smsNotifications: input.smsNotifications,
      digestFrequency: input.digestFrequency,
      updatedAt: new Date(),
    };
  }
}

export async function getProfileSafetySettings(userId: string) {
  let preferences:
    | {
        anonymousPublishingDefault: boolean;
        defaultStoryVisibility: string;
        defaultAspirationVisibility: string;
      }
    | null = null;

  try {
    preferences = await db.userPreference.findUnique({
      where: { userId },
      select: {
        anonymousPublishingDefault: true,
        defaultStoryVisibility: true,
        defaultAspirationVisibility: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }
  }

  if (!preferences) {
    return {
      anonymousPublishingDefault: false,
      defaultStoryVisibility: "PUBLIC" as ProfileStoryVisibility,
      defaultAspirationVisibility: "PUBLIC" as ProfileStoryVisibility,
    };
  }

  const normalizeVisibility = (value: string | null | undefined): ProfileStoryVisibility => {
    if (value === "FOLLOWERS_ONLY" || value === "PRIVATE") {
      return value;
    }

    return "PUBLIC";
  };

  return {
    anonymousPublishingDefault: Boolean(preferences.anonymousPublishingDefault),
    defaultStoryVisibility: normalizeVisibility(preferences.defaultStoryVisibility),
    defaultAspirationVisibility: normalizeVisibility(preferences.defaultAspirationVisibility),
  };
}

export async function upsertProfileSafetySettings(input: SafetySettingsInput) {
  try {
    return await db.userPreference.upsert({
      where: {
        userId: input.userId,
      },
      create: {
        userId: input.userId,
        anonymousPublishingDefault: input.anonymousPublishingDefault,
        defaultStoryVisibility: input.defaultStoryVisibility,
        defaultAspirationVisibility: input.defaultAspirationVisibility,
        preferredCategories: [],
        emotionalTonePreference: [],
        followedTags: [],
        blockedTags: [],
      },
      update: {
        anonymousPublishingDefault: input.anonymousPublishingDefault,
        defaultStoryVisibility: input.defaultStoryVisibility,
        defaultAspirationVisibility: input.defaultAspirationVisibility,
      },
      select: {
        userId: true,
        anonymousPublishingDefault: true,
        defaultStoryVisibility: true,
        defaultAspirationVisibility: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }

    return {
      userId: input.userId,
      anonymousPublishingDefault: input.anonymousPublishingDefault,
      defaultStoryVisibility: input.defaultStoryVisibility,
      defaultAspirationVisibility: input.defaultAspirationVisibility,
      updatedAt: new Date(),
    };
  }
}

export async function getPublicProfileVisibilitySettings(userId: string) {
  let preferences: { preferredCategories: string[] } | null = null;

  try {
    preferences = await db.userPreference.findUnique({
      where: { userId },
      select: {
        preferredCategories: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }

    return { ...DEFAULT_PUBLIC_PROFILE_VISIBILITY_SETTINGS };
  }

  return parsePublicProfileVisibilityFromPreferredCategories(
    preferences?.preferredCategories,
  );
}

export async function upsertPublicProfileVisibilitySettings({
  userId,
  visibility,
}: {
  userId: string;
  visibility: Partial<PublicProfileVisibilitySettings>;
}) {
  let existing: { preferredCategories: string[] } | null = null;

  try {
    existing = await db.userPreference.findUnique({
      where: { userId },
      select: {
        preferredCategories: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }
  }

  const normalizedVisibility = normalizePublicProfileVisibilitySettings(visibility);
  const preferredCategories = buildPreferredCategoriesWithProfileVisibility(
    existing?.preferredCategories,
    normalizedVisibility,
  );

  try {
    return await db.userPreference.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        preferredCategories,
        emotionalTonePreference: [],
        followedTags: [],
        blockedTags: [],
      },
      update: {
        preferredCategories,
      },
      select: {
        userId: true,
        preferredCategories: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    if (!isPreferenceSchemaCompatibilityError(error)) {
      throw error;
    }

    return {
      userId,
      preferredCategories,
      updatedAt: new Date(),
    };
  }
}

export async function blockUserByUsername({
  blockerId,
  blockedUsername,
  reason,
}: {
  blockerId: string;
  blockedUsername: string;
  reason?: string;
}) {
  const blocked = await db.user.findFirst({
    where: {
      username: blockedUsername.trim().toLowerCase(),
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!blocked) {
    throw new Error("user-not-found");
  }

  if (blocked.id === blockerId) {
    throw new Error("cannot-block-self");
  }

  await db.userBlock.upsert({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId: blocked.id,
      },
    },
    update: {
      reason: normalizeOptionalString(reason, 300),
    },
    create: {
      blockerId,
      blockedId: blocked.id,
      reason: normalizeOptionalString(reason, 300),
    },
  });
}

export async function reportUserByUsername({
  reporterId,
  reportedUsername,
  description,
}: {
  reporterId: string;
  reportedUsername: string;
  description?: string;
}) {
  const reported = await db.user.findFirst({
    where: {
      username: reportedUsername.trim().toLowerCase(),
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!reported) {
    throw new Error("user-not-found");
  }

  if (reported.id === reporterId) {
    throw new Error("cannot-report-self");
  }

  await db.report.create({
    data: {
      reporterId,
      reportedUserId: reported.id,
      reason: "HARASSMENT",
      description: normalizeOptionalString(description, 500),
    },
  });
}