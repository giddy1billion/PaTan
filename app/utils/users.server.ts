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

const SCRYPT_KEY_LENGTH = 64;

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

async function generateUniqueUsername(base: string) {
  const normalizedBase = slugifyUsername(base) || "patanuser";

  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? normalizedBase : `${normalizedBase}${i}`;
    const existing = await db.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }

  return `${normalizedBase}${Date.now().toString().slice(-6)}`;
}

function hashPassword(password: string) {
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

  const usernameBase = input.firstName || email.split("@")[0] || "patanuser";
  const username = await generateUniqueUsername(usernameBase);

  const created = await db.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash: hashPassword(input.password),
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
}): Promise<SessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.user.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    ...toSessionUser(user),
    provider: "local",
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