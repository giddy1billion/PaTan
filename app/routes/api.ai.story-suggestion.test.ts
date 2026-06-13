import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/rate-limit.server", () => ({
  enforceAuthRateLimit: vi.fn(),
}));

vi.mock("~/utils/notifications.server", () => ({
  createNotification: vi.fn(),
}));

vi.mock("~/utils/ai.server", () => ({
  generateAiStorySuggestion: vi.fn(),
  buildLocalStorySuggestion: vi.fn(),
  getAiServiceStatus: vi.fn(),
  normalizeAiSuggestionType: vi.fn((input: unknown) => {
    const value = String(input ?? "reflection").trim().toLowerCase();
    if (value === "grammar") return "grammar";
    if (value === "structure") return "structure";
    if (value === "title") return "title";
    return "reflection";
  }),
}));

import { action } from "~/routes/api.ai.story-suggestion";
import { requireUser } from "~/utils/auth.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
import { createNotification } from "~/utils/notifications.server";
import {
  buildLocalStorySuggestion,
  generateAiStorySuggestion,
  getAiServiceStatus,
} from "~/utils/ai.server";

describe("API AI story suggestion route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(enforceAuthRateLimit).mockResolvedValue({
      allowed: true,
      headers: new Headers({ "X-RateLimit-Limit": "20", "X-RateLimit-Remaining": "19" }),
    } as any);

    vi.mocked(getAiServiceStatus).mockReturnValue({
      configured: true,
      endpointCount: 1,
      endpoints: [],
      model: "gpt-4.1-mini",
      timeoutMs: 15000,
      maxRetries: 2,
      maxConcurrency: 8,
    });

    vi.mocked(buildLocalStorySuggestion).mockReturnValue("fallback suggestion");
  });

  function buildRequest(body: Record<string, unknown>) {
    return new Request("http://localhost/api/ai/story-suggestion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
      },
      body: JSON.stringify(body),
    });
  }

  it("returns AI suggestion metadata on success", async () => {
    vi.mocked(generateAiStorySuggestion).mockResolvedValue({
      ok: true,
      suggestion: "generated suggestion",
      metadata: {
        requestId: "req-1",
        endpoint: "https://example.openai.azure.com/openai/v1",
        endpointKind: "openai-v1",
        model: "gpt-4.1-mini",
        latencyMs: 320,
        attempts: 1,
        statusCode: 200,
      },
    });

    const response = await action({
      request: buildRequest({
        suggestionType: "structure",
        title: "Finding Light",
        content: "I felt overwhelmed, then I found a new routine that helped me heal.",
      }),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.suggestion).toBe("generated suggestion");
    expect(json.fallbackUsed).toBe(false);
    expect(json.metadata.requestId).toBe("req-1");

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "AI_SUGGESTION",
        data: expect.objectContaining({
          fallbackUsed: false,
          requestId: "req-1",
        }),
      }),
    );
  });

  it("returns 429 when rate limit blocks request", async () => {
    vi.mocked(enforceAuthRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 42,
      headers: new Headers({ "Retry-After": "42" }),
    } as any);

    const response = await action({
      request: buildRequest({
        suggestionType: "reflection",
        title: "Finding Light",
        content: "This content is long enough for the model to process safely.",
      }),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe("rate-limited");
    expect(json.retryAfterSeconds).toBe(42);
    expect(generateAiStorySuggestion).not.toHaveBeenCalled();
  });

  it("falls back to local suggestion when upstream fails", async () => {
    vi.mocked(generateAiStorySuggestion).mockResolvedValue({
      ok: false,
      reason: "upstream-failure",
      retryable: true,
      message: "request-timeout",
      requestId: "req-timeout",
    });

    const response = await action({
      request: buildRequest({
        suggestionType: "grammar",
        title: "Finding Light",
        content: "I felt overwhelmed at first, then I started rebuilding my routines and felt stronger.",
      }),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.suggestion).toBe("fallback suggestion");
    expect(json.fallbackUsed).toBe(true);
    expect(json.warning).toBe("upstream-failure");
    expect(json.requestId).toBe("req-timeout");

    expect(buildLocalStorySuggestion).toHaveBeenCalledWith(
      "grammar",
      "Finding Light",
      expect.any(String),
    );
  });

  it("returns 400 for short content", async () => {
    const response = await action({
      request: buildRequest({
        suggestionType: "reflection",
        title: "Short",
        content: "Too short",
      }),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("invalid-input");
  });
});
