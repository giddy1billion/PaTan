import { randomUUID } from "node:crypto";

export type OAuthProvider = "google" | "facebook";

export type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
  name: string;
  avatarUrl?: string;
};

type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export class OAuthConfigError extends Error {
  provider: OAuthProvider;
  missingVars: string[];

  constructor(provider: OAuthProvider, missingVars: string[]) {
    super(`Missing OAuth environment variables for ${provider}: ${missingVars.join(", ")}`);
    this.name = "OAuthConfigError";
    this.provider = provider;
    this.missingVars = missingVars;
  }
}

export class OAuthFlowError extends Error {
  code:
    | "invalid-provider"
    | "token-exchange-failed"
    | "profile-fetch-failed"
    | "missing-profile-id"
    | "missing-profile-name";

  constructor(
    code:
      | "invalid-provider"
      | "token-exchange-failed"
      | "profile-fetch-failed"
      | "missing-profile-id"
      | "missing-profile-name",
    message: string,
  ) {
    super(message);
    this.name = "OAuthFlowError";
    this.code = code;
  }
}

export function parseOAuthProvider(input: string | undefined): OAuthProvider | null {
  if (input === "google" || input === "facebook") {
    return input;
  }

  return null;
}

function getOAuthConfig(provider: OAuthProvider): ProviderConfig {
  const prefix = provider.toUpperCase();
  const clientIdVar = `${prefix}_CLIENT_ID`;
  const clientSecretVar = `${prefix}_CLIENT_SECRET`;
  const redirectUriVar = `${prefix}_REDIRECT_URI`;

  const clientId = process.env[clientIdVar]?.trim();
  const clientSecret = process.env[clientSecretVar]?.trim();
  const redirectUri = process.env[redirectUriVar]?.trim();

  const missingVars = [
    !clientId ? clientIdVar : null,
    !clientSecret ? clientSecretVar : null,
    !redirectUri ? redirectUriVar : null,
  ].filter(Boolean) as string[];

  if (missingVars.length > 0) {
    throw new OAuthConfigError(provider, missingVars);
  }

  return {
    clientId: clientId as string,
    clientSecret: clientSecret as string,
    redirectUri: redirectUri as string,
  };
}

export function createOAuthAuthorizationUrl({
  provider,
  state,
}: {
  provider: OAuthProvider;
  state: string;
}) {
  const config = getOAuthConfig(provider);

  if (provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeGoogleCodeForToken(code: string, config: ProviderConfig) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new OAuthFlowError(
      "token-exchange-failed",
      `Google token exchange failed with status ${response.status}`,
    );
  }

  const tokenData = (await response.json()) as { access_token?: string };

  if (!tokenData.access_token) {
    throw new OAuthFlowError("token-exchange-failed", "Google token response missing access token");
  }

  return tokenData.access_token;
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new OAuthFlowError(
      "profile-fetch-failed",
      `Google profile fetch failed with status ${response.status}`,
    );
  }

  const profile = (await response.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };

  if (!profile.sub) {
    throw new OAuthFlowError("missing-profile-id", "Google profile did not include user id");
  }

  if (!profile.name) {
    throw new OAuthFlowError("missing-profile-name", "Google profile did not include display name");
  }

  return {
    provider: "google",
    providerUserId: profile.sub,
    email: profile.email?.toLowerCase() ?? null,
    name: profile.name,
    avatarUrl: profile.picture,
  };
}

async function exchangeFacebookCodeForToken(code: string, config: ProviderConfig) {
  const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", config.redirectUri);
  tokenUrl.searchParams.set("code", code);

  const response = await fetch(tokenUrl);

  if (!response.ok) {
    throw new OAuthFlowError(
      "token-exchange-failed",
      `Facebook token exchange failed with status ${response.status}`,
    );
  }

  const tokenData = (await response.json()) as { access_token?: string };

  if (!tokenData.access_token) {
    throw new OAuthFlowError("token-exchange-failed", "Facebook token response missing access token");
  }

  return tokenData.access_token;
}

async function fetchFacebookProfile(accessToken: string): Promise<OAuthProfile> {
  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  profileUrl.searchParams.set("access_token", accessToken);

  const response = await fetch(profileUrl);

  if (!response.ok) {
    throw new OAuthFlowError(
      "profile-fetch-failed",
      `Facebook profile fetch failed with status ${response.status}`,
    );
  }

  const profile = (await response.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };

  if (!profile.id) {
    throw new OAuthFlowError("missing-profile-id", "Facebook profile did not include user id");
  }

  if (!profile.name) {
    throw new OAuthFlowError("missing-profile-name", "Facebook profile did not include display name");
  }

  return {
    provider: "facebook",
    providerUserId: profile.id,
    email: profile.email?.toLowerCase() ?? null,
    name: profile.name,
    avatarUrl: profile.picture?.data?.url,
  };
}

export async function fetchOAuthProfile({
  provider,
  code,
}: {
  provider: OAuthProvider;
  code: string;
}): Promise<OAuthProfile> {
  const config = getOAuthConfig(provider);

  if (provider === "google") {
    const accessToken = await exchangeGoogleCodeForToken(code, config);
    return fetchGoogleProfile(accessToken);
  }

  if (provider === "facebook") {
    const accessToken = await exchangeFacebookCodeForToken(code, config);
    return fetchFacebookProfile(accessToken);
  }

  throw new OAuthFlowError("invalid-provider", `Unsupported provider: ${provider}`);
}

export function createOAuthState() {
  return randomUUID();
}
