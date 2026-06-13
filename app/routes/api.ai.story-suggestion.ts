import type { ActionFunctionArgs } from "react-router";
import { requireUser } from "~/utils/auth.server";
import { createNotification } from "~/utils/notifications.server";
import {
  buildLocalStorySuggestion,
  generateAiStorySuggestion,
  getAiServiceStatus,
  normalizeAiSuggestionType,
} from "~/utils/ai.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";

type SuggestionRequestBody = {
  suggestionType?: unknown;
  title?: unknown;
  content?: unknown;
};

function toJsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
  responseHeaders.set("Pragma", "no-cache");
  responseHeaders.set("Expires", "0");

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function parseRequestBody(input: SuggestionRequestBody) {
  return {
    suggestionType: normalizeAiSuggestionType(input.suggestionType),
    title: String(input.title ?? "").trim().slice(0, 140),
    content: String(input.content ?? "").trim().slice(0, 8000),
  };
}

function parseOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const originHeader = parseOrigin(request.headers.get("Origin"));
  const refererOrigin = parseOrigin(request.headers.get("Referer"));

  const allowedOrigins = new Set<string>([requestUrl.origin]);

  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (configuredOrigin) {
    const parsed = parseOrigin(configuredOrigin);
    if (parsed) {
      allowedOrigins.add(parsed);
    }
  }

  if (originHeader && allowedOrigins.has(originHeader)) {
    return true;
  }

  if (refererOrigin && allowedOrigins.has(refererOrigin)) {
    return true;
  }

  return false;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method.toUpperCase() !== "POST") {
    return toJsonResponse(
      {
        error: "method-not-allowed",
        message: "Use POST for AI suggestion generation.",
      },
      405,
      {
        Allow: "POST",
      },
    );
  }

  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return toJsonResponse(
      {
        error: "unsupported-media-type",
        message: "Use application/json for request body.",
      },
      415,
    );
  }

  if (!isAllowedRequestOrigin(request)) {
    return toJsonResponse(
      {
        error: "forbidden-origin",
        message: "Request origin is not allowed.",
      },
      403,
    );
  }

  const user = await requireUser(request);

  const rateLimitResult = await enforceAuthRateLimit({
    request,
    scope: "ai-suggest",
    identifier: user.email,
  });

  if (!rateLimitResult.allowed) {
    return toJsonResponse(
      {
        error: "rate-limited",
        message: "Too many AI requests. Please wait before trying again.",
        retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      },
      429,
      rateLimitResult.headers,
    );
  }

  let body: SuggestionRequestBody;

  try {
    body = (await request.json()) as SuggestionRequestBody;
  } catch {
    return toJsonResponse(
      {
        error: "invalid-json",
        message: "Request body must be valid JSON.",
      },
      400,
      rateLimitResult.headers,
    );
  }

  const payload = parseRequestBody(body);
  if (!payload.content || payload.content.length < 20) {
    return toJsonResponse(
      {
        error: "invalid-input",
        message: "Add at least 20 characters of story content to generate a useful suggestion.",
      },
      400,
      rateLimitResult.headers,
    );
  }

  const aiResult = await generateAiStorySuggestion({
    suggestionType: payload.suggestionType,
    title: payload.title,
    content: payload.content,
  });

  const serviceStatus = getAiServiceStatus();
  const fallbackUsed = !aiResult.ok;
  const suggestion = aiResult.ok
    ? aiResult.suggestion
    : buildLocalStorySuggestion(payload.suggestionType, payload.title, payload.content);

  await createNotification({
    userId: user.id,
    type: "AI_SUGGESTION",
    title: fallbackUsed ? "AI writing suggestion ready (fallback mode)" : "AI writing suggestion ready",
    body: suggestion.slice(0, 180),
    resourceType: "story_draft",
    data: {
      suggestionType: payload.suggestionType,
      fallbackUsed,
      requestId: aiResult.ok ? aiResult.metadata.requestId : aiResult.requestId,
      endpoint: aiResult.ok ? aiResult.metadata.endpoint : null,
      endpointKind: aiResult.ok ? aiResult.metadata.endpointKind : null,
      model: aiResult.ok ? aiResult.metadata.model : serviceStatus.model,
      upstreamConfigured: serviceStatus.configured,
      upstreamError: aiResult.ok ? null : aiResult.message,
    },
  });

  if (aiResult.ok) {
    return toJsonResponse(
      {
        suggestion,
        fallbackUsed: false,
        metadata: aiResult.metadata,
      },
      200,
      rateLimitResult.headers,
    );
  }

  const status = aiResult.reason === "invalid-input" ? 400 : 200;

  return toJsonResponse(
    {
      suggestion,
      fallbackUsed: true,
      warning: aiResult.reason,
      requestId: aiResult.requestId,
      message: aiResult.message,
      retryable: aiResult.retryable,
    },
    status,
    rateLimitResult.headers,
  );
}