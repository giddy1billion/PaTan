type BotDefenseProvider = "turnstile" | "recaptcha";

type BotDefenseConfig = {
  enabled: boolean;
  provider: BotDefenseProvider;
  siteKey: string;
  secretKey: string;
  minScore: number;
};

export type BotDefenseClientConfig = {
  enabled: boolean;
  provider: BotDefenseProvider;
  siteKey: string;
};

export type BotVerificationResult = {
  ok: boolean;
  reason:
    | "disabled"
    | "missing-token"
    | "invalid-token"
    | "verification-error"
    | "provider-unconfigured";
  score?: number;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();
  return (
    forwardedIp ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}

function getProvider() {
  const rawProvider = process.env.BOT_DEFENSE_PROVIDER?.trim().toLowerCase();
  if (rawProvider === "recaptcha") {
    return "recaptcha" as const;
  }

  return "turnstile" as const;
}

function getBotDefenseConfig(): BotDefenseConfig {
  const enabled = process.env.BOT_DEFENSE_ENABLED !== "false";
  const provider = getProvider();

  const siteKey =
    provider === "turnstile"
      ? process.env.TURNSTILE_SITE_KEY?.trim() ?? ""
      : process.env.RECAPTCHA_SITE_KEY?.trim() ?? "";

  const secretKey =
    provider === "turnstile"
      ? process.env.TURNSTILE_SECRET_KEY?.trim() ?? ""
      : process.env.RECAPTCHA_SECRET_KEY?.trim() ?? "";

  const minScore = Number(process.env.BOT_DEFENSE_MIN_SCORE ?? "0.5");

  return {
    enabled,
    provider,
    siteKey,
    secretKey,
    minScore: Number.isFinite(minScore) ? minScore : 0.5,
  };
}

export function getBotDefenseClientConfig(): BotDefenseClientConfig {
  const config = getBotDefenseConfig();
  const configured = Boolean(config.siteKey);

  return {
    enabled: config.enabled && configured,
    provider: config.provider,
    siteKey: config.siteKey,
  };
}

async function verifyTurnstileToken({
  token,
  request,
  secretKey,
}: {
  token: string;
  request: Request;
  secretKey: string;
}): Promise<BotVerificationResult> {
  const ip = getClientIp(request);
  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (ip) {
    payload.set("remoteip", ip);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    if (!response.ok) {
      return { ok: false, reason: "verification-error" };
    }

    const result = (await response.json()) as {
      success?: boolean;
    };

    if (!result.success) {
      return { ok: false, reason: "invalid-token" };
    }

    return { ok: true, reason: "disabled" };
  } catch {
    return { ok: false, reason: "verification-error" };
  }
}

async function verifyRecaptchaToken({
  token,
  request,
  secretKey,
  minScore,
}: {
  token: string;
  request: Request;
  secretKey: string;
  minScore: number;
}): Promise<BotVerificationResult> {
  const ip = getClientIp(request);
  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (ip) {
    payload.set("remoteip", ip);
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    if (!response.ok) {
      return { ok: false, reason: "verification-error" };
    }

    const result = (await response.json()) as {
      success?: boolean;
      score?: number;
    };

    if (!result.success) {
      return { ok: false, reason: "invalid-token", score: result.score };
    }

    if (typeof result.score === "number" && result.score < minScore) {
      return { ok: false, reason: "invalid-token", score: result.score };
    }

    return { ok: true, reason: "disabled", score: result.score };
  } catch {
    return { ok: false, reason: "verification-error" };
  }
}

export async function verifyBotDefenseToken({
  token,
  request,
}: {
  token: string | null | undefined;
  request: Request;
}): Promise<BotVerificationResult> {
  const config = getBotDefenseConfig();
  if (!config.enabled) {
    return { ok: true, reason: "disabled" };
  }

  if (!config.siteKey || !config.secretKey) {
    return { ok: false, reason: "provider-unconfigured" };
  }

  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  if (config.provider === "turnstile") {
    return verifyTurnstileToken({ token, request, secretKey: config.secretKey });
  }

  return verifyRecaptchaToken({
    token,
    request,
    secretKey: config.secretKey,
    minScore: config.minScore,
  });
}
