import { createHash } from "node:crypto";

export type PasswordSecurityResult = {
  valid: boolean;
  errors: string[];
  breachedCount: number;
};

const MIN_PASSWORD_LENGTH = Number(process.env.AUTH_PASSWORD_MIN_LENGTH ?? "12");
const BREACHED_CHECK_ENABLED = process.env.AUTH_BREACHED_PASSWORD_CHECK !== "false";

const COMMON_PATTERNS = [
  "password",
  "qwerty",
  "letmein",
  "welcome",
  "patan",
  "123456",
  "abc123",
];

const breachCache = new Map<string, number>();

function hasMixedCase(password: string) {
  return /[a-z]/.test(password) && /[A-Z]/.test(password);
}

function hasDigit(password: string) {
  return /\d/.test(password);
}

function hasSymbol(password: string) {
  return /[^a-zA-Z0-9]/.test(password);
}

function hasExcessiveRepeats(password: string) {
  return /(.)\1{3,}/.test(password);
}

function containsEmailPart(password: string, email?: string | null) {
  if (!email) {
    return false;
  }

  const local = email.split("@")[0]?.trim().toLowerCase();
  if (!local || local.length < 4) {
    return false;
  }

  return password.toLowerCase().includes(local);
}

export function validatePasswordPolicy(password: string, email?: string | null) {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  if (!hasMixedCase(password)) {
    errors.push("Password must include both uppercase and lowercase letters.");
  }

  if (!hasDigit(password)) {
    errors.push("Password must include at least one number.");
  }

  if (!hasSymbol(password)) {
    errors.push("Password must include at least one symbol.");
  }

  if (hasExcessiveRepeats(password)) {
    errors.push("Password must not contain long repeated character sequences.");
  }

  if (containsEmailPart(password, email)) {
    errors.push("Password must not include your email name.");
  }

  const lower = password.toLowerCase();
  if (COMMON_PATTERNS.some((pattern) => lower.includes(pattern))) {
    errors.push("Password is too common or predictable.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function fetchPwnedSuffixes(prefix: string) {
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      "Add-Padding": "true",
    },
  });

  if (!response.ok) {
    throw new Error("pwned-password-check-failed");
  }

  return response.text();
}

export async function getBreachedPasswordCount(password: string): Promise<number> {
  if (!BREACHED_CHECK_ENABLED) {
    return 0;
  }

  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  if (breachCache.has(sha1)) {
    return breachCache.get(sha1) ?? 0;
  }

  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const responseBody = await fetchPwnedSuffixes(prefix);
  const lines = responseBody.split("\n");

  for (const line of lines) {
    const [lineSuffix, count] = line.trim().split(":");
    if (!lineSuffix || !count) {
      continue;
    }

    if (lineSuffix.trim().toUpperCase() === suffix) {
      const parsed = Number.parseInt(count.trim(), 10);
      const hitCount = Number.isFinite(parsed) ? parsed : 1;
      breachCache.set(sha1, hitCount);
      return hitCount;
    }
  }

  breachCache.set(sha1, 0);
  return 0;
}

export async function validateSecurePassword({
  password,
  email,
}: {
  password: string;
  email?: string | null;
}): Promise<PasswordSecurityResult> {
  const policy = validatePasswordPolicy(password, email);
  if (!policy.valid) {
    return {
      valid: false,
      errors: policy.errors,
      breachedCount: 0,
    };
  }

  let breachedCount = 0;
  try {
    breachedCount = await getBreachedPasswordCount(password);
  } catch {
    breachedCount = 0;
  }

  if (breachedCount > 0) {
    return {
      valid: false,
      errors: ["This password appears in known breach datasets. Choose a different password."],
      breachedCount,
    };
  }

  return {
    valid: true,
    errors: [],
    breachedCount,
  };
}
