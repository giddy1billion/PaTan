import { randomUUID } from "node:crypto";

export type AiSuggestionType = "grammar" | "structure" | "title" | "reflection";

type AiEndpointKind = "openai-v1" | "project-chat";

type AiEndpointConfig = {
  name: string;
  baseUrl: string;
  kind: AiEndpointKind;
};

type AiServiceConfig = {
  apiKey: string | null;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  maxOutputTokens: number;
  maxConcurrency: number;
  circuitOpenAfterFailures: number;
  circuitResetMs: number;
  temperature: number;
  endpoints: AiEndpointConfig[];
};

type CircuitState = {
  consecutiveFailures: number;
  openUntilMs: number | null;
};

type AiProviderFailure = {
  retryable: boolean;
  statusCode?: number;
  message: string;
  failureCode:
    | "request-timeout"
    | "network-error"
    | "invalid-response"
    | "upstream-error"
    | "missing-output";
};

type AiProviderSuccess = {
  suggestion: string;
  statusCode: number;
};

type AiProviderResult =
  | {
      ok: true;
      value: AiProviderSuccess;
    }
  | {
      ok: false;
      error: AiProviderFailure;
    };

type ProviderRequestInput = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
};

export type AiSuggestionSuccess = {
  ok: true;
  suggestion: string;
  metadata: {
    requestId: string;
    endpoint: string;
    endpointKind: AiEndpointKind;
    model: string;
    latencyMs: number;
    attempts: number;
    statusCode: number;
  };
};

export type AiSuggestionFailure = {
  ok: false;
  reason:
    | "service-unconfigured"
    | "invalid-input"
    | "all-endpoints-unavailable"
    | "upstream-failure";
  retryable: boolean;
  message: string;
  requestId: string;
};

export type AiSuggestionResult = AiSuggestionSuccess | AiSuggestionFailure;

const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const MAX_PROMPT_LENGTH = 8000;
const MAX_TITLE_LENGTH = 140;
const MAX_SUGGESTION_LENGTH = 1200;

const endpointCircuitStates = new Map<string, CircuitState>();

class Semaphore {
  private readonly waiters: Array<() => void> = [];

  private inUse = 0;

  constructor(private readonly limit: number) {}

  async acquire() {
    if (this.inUse < this.limit) {
      this.inUse += 1;
      return () => this.release();
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });

    this.inUse += 1;
    return () => this.release();
  }

  private release() {
    this.inUse = Math.max(0, this.inUse - 1);
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter();
    }
  }
}

const semaphoreByConcurrency = new Map<number, Semaphore>();

export function normalizeAiSuggestionType(input: unknown): AiSuggestionType {
  const normalized = String(input ?? "reflection").trim().toLowerCase();
  if (normalized === "grammar") return "grammar";
  if (normalized === "structure") return "structure";
  if (normalized === "title") return "title";
  return "reflection";
}

function getSemaphore(limit: number) {
  const normalizedLimit = Math.max(1, limit);
  const existing = semaphoreByConcurrency.get(normalizedLimit);

  if (existing) {
    return existing;
  }

  const created = new Semaphore(normalizedLimit);
  semaphoreByConcurrency.set(normalizedLimit, created);
  return created;
}

function readPositiveNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoundedNumberEnv(name: string, fallback: number, min: number, max: number) {
  const parsed = readPositiveNumberEnv(name, fallback);
  return Math.min(max, Math.max(min, parsed));
}

function normalizeEndpoint(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

function detectEndpointKind(baseUrl: string): AiEndpointKind {
  if (baseUrl.toLowerCase().includes("/openai/v1")) {
    return "openai-v1";
  }

  return "project-chat";
}

function getAiServiceConfig(): AiServiceConfig {
  const apiKey =
    process.env.AI_SERVICE_API_KEY?.trim() ?? process.env.AZURE_OPENAI_API_KEY?.trim() ?? null;

  const model = process.env.AI_MODEL?.trim() || "gpt-4.1-mini";
  const timeoutMs = readPositiveNumberEnv("AI_TIMEOUT_MS", 15000);
  const maxRetries = Math.floor(readBoundedNumberEnv("AI_MAX_RETRIES", 2, 0, 5));
  const retryBaseDelayMs = readPositiveNumberEnv("AI_RETRY_BASE_DELAY_MS", 300);
  const maxOutputTokens = Math.floor(readBoundedNumberEnv("AI_MAX_OUTPUT_TOKENS", 450, 64, 2000));
  const maxConcurrency = Math.floor(readBoundedNumberEnv("AI_MAX_CONCURRENCY", 8, 1, 64));
  const circuitOpenAfterFailures = Math.floor(
    readBoundedNumberEnv("AI_CIRCUIT_OPEN_AFTER_FAILURES", 5, 1, 20),
  );
  const circuitResetMs = readPositiveNumberEnv("AI_CIRCUIT_RESET_MS", 45000);
  const temperature = readBoundedNumberEnv("AI_TEMPERATURE", 0.4, 0, 1.5);

  const projectEndpoint = normalizeEndpoint(
    process.env.AI_PROJECT_ENDPOINT ?? process.env.AZURE_AI_PROJECT_ENDPOINT,
  );
  const azureOpenAiEndpoint = normalizeEndpoint(process.env.AZURE_OPENAI_ENDPOINT);

  const endpoints: AiEndpointConfig[] = [];

  if (projectEndpoint) {
    endpoints.push({
      name: "project-endpoint",
      baseUrl: projectEndpoint,
      kind: detectEndpointKind(projectEndpoint),
    });
  }

  if (azureOpenAiEndpoint) {
    endpoints.push({
      name: "azure-openai-endpoint",
      baseUrl: azureOpenAiEndpoint,
      kind: detectEndpointKind(azureOpenAiEndpoint),
    });
  }

  return {
    apiKey,
    model,
    timeoutMs,
    maxRetries,
    retryBaseDelayMs,
    maxOutputTokens,
    maxConcurrency,
    circuitOpenAfterFailures,
    circuitResetMs,
    temperature,
    endpoints,
  };
}

export function getAiServiceStatus() {
  const config = getAiServiceConfig();

  return {
    configured: Boolean(config.apiKey && config.endpoints.length > 0),
    endpointCount: config.endpoints.length,
    endpoints: config.endpoints.map((endpoint) => ({
      name: endpoint.name,
      kind: endpoint.kind,
      baseUrl: endpoint.baseUrl,
    })),
    model: config.model,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    maxConcurrency: config.maxConcurrency,
  };
}

function sanitizeSuggestion(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_SUGGESTION_LENGTH);
}

function createPrompts({
  suggestionType,
  title,
  content,
}: {
  suggestionType: AiSuggestionType;
  title: string;
  content: string;
}) {
  const storyTitle = title || "Untitled story";

  const systemPrompt =
    "You are an empathetic writing coach for a belief-inclusive, safety-focused storytelling platform. " +
    "Produce concise, practical guidance while preserving the author's voice. " +
    "Never fabricate personal facts. " +
    "If content references self-harm or violence, suggest seeking professional or emergency support in a calm tone.";

  const instructionByType: Record<AiSuggestionType, string> = {
    grammar:
      "Return 4-6 sentence-level edits that improve clarity and flow, then provide one revised short paragraph.",
    structure:
      "Return a clear 3-part outline (beginning, turning point, resolution) and one transition sentence between each part.",
    title:
      "Return 8 title options with varied tone and length. Keep titles authentic and non-sensational.",
    reflection:
      "Return 5 reflective prompts and one short encouragement paragraph for the author.",
  };

  const userPrompt =
    `Suggestion type: ${suggestionType}\n` +
    `Story title: ${storyTitle}\n` +
    `Story draft:\n${content}\n\n` +
    `Task: ${instructionByType[suggestionType]}\n` +
    "Keep output under 250 words unless suggestion type is title. Use plain text only.";

  return { systemPrompt, userPrompt };
}

function getCircuitState(endpointKey: string): CircuitState {
  const existing = endpointCircuitStates.get(endpointKey);
  if (existing) {
    return existing;
  }

  const created: CircuitState = {
    consecutiveFailures: 0,
    openUntilMs: null,
  };

  endpointCircuitStates.set(endpointKey, created);
  return created;
}

function canAttemptEndpoint(endpoint: AiEndpointConfig) {
  const state = getCircuitState(endpoint.baseUrl);
  if (!state.openUntilMs) {
    return true;
  }

  if (Date.now() >= state.openUntilMs) {
    state.openUntilMs = null;
    return true;
  }

  return false;
}

function markEndpointSuccess(endpoint: AiEndpointConfig) {
  const state = getCircuitState(endpoint.baseUrl);
  state.consecutiveFailures = 0;
  state.openUntilMs = null;
}

function markEndpointFailure(
  endpoint: AiEndpointConfig,
  openAfterFailures: number,
  resetMs: number,
) {
  const state = getCircuitState(endpoint.baseUrl);
  state.consecutiveFailures += 1;

  if (state.consecutiveFailures >= openAfterFailures) {
    state.openUntilMs = Date.now() + resetMs;
  }
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const responsePayload = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        type?: unknown;
        text?: unknown;
      }>;
    }>;
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  if (typeof responsePayload.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text;
  }

  if (Array.isArray(responsePayload.output)) {
    for (const item of responsePayload.output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const chunk of content) {
        if (typeof chunk?.text === "string" && chunk.text.trim()) {
          return chunk.text;
        }
      }
    }
  }

  const firstChoice = responsePayload.choices?.[0]?.message?.content;
  if (typeof firstChoice === "string" && firstChoice.trim()) {
    return firstChoice;
  }

  return null;
}

function createAbortController(timeoutMs: number, parentSignal?: AbortSignal) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error("ai-request-timeout"));
  }, timeoutMs);

  const onAbort = () => {
    controller.abort(parentSignal?.reason ?? new Error("ai-request-aborted"));
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      onAbort();
    } else {
      parentSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener("abort", onAbort);
    },
  };
}

async function parseJsonPayload(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function callOpenAiV1Endpoint({
  endpoint,
  requestId,
  input,
  parentSignal,
}: {
  endpoint: AiEndpointConfig;
  requestId: string;
  input: ProviderRequestInput;
  parentSignal?: AbortSignal;
}): Promise<AiProviderResult> {
  const url = `${endpoint.baseUrl}/responses`;
  const timed = createAbortController(input.timeoutMs, parentSignal);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": input.apiKey,
        "x-ms-client-request-id": requestId,
      },
      body: JSON.stringify({
        model: input.model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: input.systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: input.userPrompt }],
          },
        ],
        temperature: input.temperature,
        max_output_tokens: input.maxOutputTokens,
      }),
      signal: timed.signal,
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          retryable: RETRYABLE_STATUS_CODES.has(response.status),
          statusCode: response.status,
          message: `upstream-status-${response.status}`,
          failureCode: "upstream-error",
        },
      };
    }

    const output = extractOutputText(payload);
    if (!output) {
      return {
        ok: false,
        error: {
          retryable: false,
          statusCode: response.status,
          message: "missing-output",
          failureCode: "missing-output",
        },
      };
    }

    return {
      ok: true,
      value: {
        suggestion: output,
        statusCode: response.status,
      },
    };
  } catch (error) {
    if (timed.signal.aborted) {
      return {
        ok: false,
        error: {
          retryable: true,
          message: "request-timeout",
          failureCode: "request-timeout",
        },
      };
    }

    return {
      ok: false,
      error: {
        retryable: true,
        message: error instanceof Error ? error.message : "network-error",
        failureCode: "network-error",
      },
    };
  } finally {
    timed.cleanup();
  }
}

async function callProjectChatEndpoint({
  endpoint,
  requestId,
  input,
  parentSignal,
}: {
  endpoint: AiEndpointConfig;
  requestId: string;
  input: ProviderRequestInput;
  parentSignal?: AbortSignal;
}): Promise<AiProviderResult> {
  const apiVersion = process.env.AI_PROJECT_API_VERSION?.trim() || "2024-05-01-preview";
  const url = `${endpoint.baseUrl}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  const timed = createAbortController(input.timeoutMs, parentSignal);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": input.apiKey,
        "x-ms-client-request-id": requestId,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature,
        max_tokens: input.maxOutputTokens,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
      signal: timed.signal,
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          retryable: RETRYABLE_STATUS_CODES.has(response.status),
          statusCode: response.status,
          message: `upstream-status-${response.status}`,
          failureCode: "upstream-error",
        },
      };
    }

    const output = extractOutputText(payload);
    if (!output) {
      return {
        ok: false,
        error: {
          retryable: false,
          statusCode: response.status,
          message: "missing-output",
          failureCode: "missing-output",
        },
      };
    }

    return {
      ok: true,
      value: {
        suggestion: output,
        statusCode: response.status,
      },
    };
  } catch (error) {
    if (timed.signal.aborted) {
      return {
        ok: false,
        error: {
          retryable: true,
          message: "request-timeout",
          failureCode: "request-timeout",
        },
      };
    }

    return {
      ok: false,
      error: {
        retryable: true,
        message: error instanceof Error ? error.message : "network-error",
        failureCode: "network-error",
      },
    };
  } finally {
    timed.cleanup();
  }
}

function shouldRetry(result: AiProviderResult) {
  return !result.ok && result.error.retryable;
}

function backoffDelayMs(baseDelayMs: number, attempt: number) {
  const exp = Math.min(6, attempt);
  const base = baseDelayMs * Math.pow(2, exp);
  const jitter = Math.floor(Math.random() * Math.max(50, Math.floor(base * 0.3)));
  return base + jitter;
}

async function wait(ms: number, signal?: AbortSignal) {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new Error("request-aborted"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function callEndpointWithRetries({
  endpoint,
  requestId,
  config,
  systemPrompt,
  userPrompt,
  signal,
}: {
  endpoint: AiEndpointConfig;
  requestId: string;
  config: AiServiceConfig;
  systemPrompt: string;
  userPrompt: string;
  signal?: AbortSignal;
}): Promise<{ result: AiProviderResult; attempts: number }> {
  const input: ProviderRequestInput = {
    model: config.model,
    systemPrompt,
    userPrompt,
    apiKey: config.apiKey as string,
    timeoutMs: config.timeoutMs,
    maxOutputTokens: config.maxOutputTokens,
    temperature: config.temperature,
  };

  let attempts = 0;
  let lastResult: AiProviderResult = {
    ok: false,
    error: {
      retryable: false,
      message: "endpoint-not-attempted",
      failureCode: "upstream-error",
    },
  };

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    attempts += 1;

    const result =
      endpoint.kind === "openai-v1"
        ? await callOpenAiV1Endpoint({ endpoint, requestId, input, parentSignal: signal })
        : await callProjectChatEndpoint({ endpoint, requestId, input, parentSignal: signal });

    lastResult = result;

    if (result.ok || !shouldRetry(result) || attempt === config.maxRetries) {
      return { result, attempts };
    }

    const delayMs = backoffDelayMs(config.retryBaseDelayMs, attempt);
    await wait(delayMs, signal);
  }

  return { result: lastResult, attempts };
}

export function buildLocalStorySuggestion(
  suggestionType: AiSuggestionType,
  title: string,
  content: string,
) {
  const storyLabel = title.trim() || "your story";
  const preview = content.slice(0, 220).trim();

  if (suggestionType === "grammar") {
    return `Refine sentence clarity in ${storyLabel} by shortening long sentences and replacing repeated phrases. Keep the same voice while tightening wording around: "${preview}".`;
  }

  if (suggestionType === "structure") {
    return `Structure ${storyLabel} into three parts: what happened, what changed, and what you learned. Add a short transition between each part so readers can follow your journey.`;
  }

  if (suggestionType === "title") {
    return `Title ideas for ${storyLabel}: "Light Through the Hard Days", "How Hope Found Me Again", and "The Turning Point I Did Not Expect".`;
  }

  return `Reflection prompt for ${storyLabel}: What moment made you realize growth was possible, and what would you say to someone facing the same season today?`;
}

export async function generateAiStorySuggestion({
  suggestionType,
  title,
  content,
  signal,
}: {
  suggestionType: AiSuggestionType;
  title: string;
  content: string;
  signal?: AbortSignal;
}): Promise<AiSuggestionResult> {
  const config = getAiServiceConfig();
  const requestId = randomUUID();

  const normalizedTitle = title.trim().slice(0, MAX_TITLE_LENGTH);
  const normalizedContent = content.trim().slice(0, MAX_PROMPT_LENGTH);

  if (!normalizedContent || normalizedContent.length < 20) {
    return {
      ok: false,
      reason: "invalid-input",
      retryable: false,
      message: "content-too-short",
      requestId,
    };
  }

  if (!config.apiKey || config.endpoints.length === 0) {
    return {
      ok: false,
      reason: "service-unconfigured",
      retryable: false,
      message: "ai-service-unconfigured",
      requestId,
    };
  }

  const availableEndpoints = config.endpoints.filter((endpoint) => canAttemptEndpoint(endpoint));
  if (availableEndpoints.length === 0) {
    return {
      ok: false,
      reason: "all-endpoints-unavailable",
      retryable: true,
      message: "all-circuits-open",
      requestId,
    };
  }

  const semaphore = getSemaphore(config.maxConcurrency);
  const release = await semaphore.acquire();

  const startedAtMs = Date.now();
  const { systemPrompt, userPrompt } = createPrompts({
    suggestionType,
    title: normalizedTitle,
    content: normalizedContent,
  });

  let lastFailure: AiProviderFailure | null = null;

  try {
    for (const endpoint of availableEndpoints) {
      const callResult = await callEndpointWithRetries({
        endpoint,
        requestId,
        config,
        systemPrompt,
        userPrompt,
        signal,
      });

      if (callResult.result.ok) {
        markEndpointSuccess(endpoint);

        return {
          ok: true,
          suggestion: sanitizeSuggestion(callResult.result.value.suggestion),
          metadata: {
            requestId,
            endpoint: endpoint.baseUrl,
            endpointKind: endpoint.kind,
            model: config.model,
            latencyMs: Date.now() - startedAtMs,
            attempts: callResult.attempts,
            statusCode: callResult.result.value.statusCode,
          },
        };
      }

      lastFailure = callResult.result.error;
      markEndpointFailure(endpoint, config.circuitOpenAfterFailures, config.circuitResetMs);
    }
  } finally {
    release();
  }

  return {
    ok: false,
    reason: "upstream-failure",
    retryable: lastFailure?.retryable ?? true,
    message: lastFailure?.message ?? "unknown-upstream-failure",
    requestId,
  };
}