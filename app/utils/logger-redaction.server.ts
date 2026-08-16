import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const REDACTED = "[REDACTED]";

// Patterns for common secret formats
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "JWT", pattern: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g },
  { name: "Bearer Token", pattern: /\bBearer\s+[A-Za-z0-9\-_.=]+/gi },
  { name: "API Key (generic)", pattern: /\b(?:api[_-]?key|apikey)[\s:=]+['"]?[A-Za-z0-9\-_]{16,}['"]?/gi },
  { name: "AWS Access Key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "AWS Secret Key", pattern: /\b(?:aws[_-]?secret|AWS_SECRET_ACCESS_KEY)[\s:=]+['"]?[A-Za-z0-9/+=]{40}['"]?/gi },
  { name: "GitHub Token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}/g },
  { name: "Google API Key", pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: "Stripe Key", pattern: /\b(?:sk|pk|rk)_(?:test|live)_[0-9a-zA-Z]{24,}/g },
  { name: "Password in URL", pattern: /:[^:@\/\?#]+@/g },
  { name: "Base64 Secret", pattern: /\b[A-Za-z0-9+/]{40,}={0,2}\b/g },
];

// Header names to redact (case-insensitive)
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "x-access-token",
  "x-refresh-token",
  "proxy-authorization",
  "www-authenticate",
];

// Field names to redact in objects (case-insensitive match)
const SENSITIVE_FIELDS = [
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "authtoken",
  "auth_token",
  "apikey",
  "api_key",
  "privatekey",
  "private_key",
  "secretkey",
  "secret_key",
  "credential",
  "credentials",
  "bearer",
  "jwt",
  "sessionid",
  "session_id",
  "csrf",
  "xsrf",
];

/**
 * Redacts sensitive information from a string
 */
export function redactString(input: string): string {
  let result = input;
  
  for (const { pattern } of SECRET_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  
  return result;
}

/**
 * Redacts sensitive headers from a Headers object or Record
 */
export function redactHeaders(
  headers: Headers | Record<string, string> | Iterable<[string, string]>
): Record<string, string> {
  const result: Record<string, string> = {};
  
  const entries = headers instanceof Headers 
    ? Array.from(headers.entries())
    : Array.isArray(headers) 
      ? headers 
      : Object.entries(headers);
  
  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_HEADERS.some(h => lowerKey.includes(h))) {
      result[key] = REDACTED;
    } else {
      // Also check value for secrets
      result[key] = redactString(value);
    }
  }
  
  return result;
}

/**
 * Redacts sensitive fields from an object recursively
 */
export function redactObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field name indicates sensitive data
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      result[key] = REDACTED;
      continue;
    }
    
    // Recursively process nested objects
    if (typeof value === "string") {
      result[key] = redactString(value);
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === "object" && item !== null 
            ? redactObject(item as Record<string, unknown>)
            : item
        );
      } else {
        result[key] = redactObject(value as Record<string, unknown>);
      }
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Redacts sensitive information from request logs
 */
export function redactRequestLog(request: Request): {
  method: string;
  url: string;
  headers: Record<string, string>;
  redacted: boolean;
} {
  const url = request.url;
  const redactedUrl = redactString(url);
  
  const redactedHeaders = redactHeaders(request.headers);
  
  return {
    method: request.method,
    url: redactedUrl,
    headers: redactedHeaders,
    redacted: redactedUrl !== url || hasRedactedValues(redactedHeaders),
  };
}

/**
 * Redacts sensitive information from response logs
 */
export function redactResponseLog(
  status: number,
  headers: Headers | Record<string, string>
): {
  status: number;
  headers: Record<string, string>;
  redacted: boolean;
} {
  const redactedHeaders = redactHeaders(headers);
  
  return {
    status,
    headers: redactedHeaders,
    redacted: hasRedactedValues(redactedHeaders),
  };
}

/**
 * Redacts sensitive information from error logs
 */
export function redactErrorLog(error: unknown): {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
} {
  const result: {
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  } = {
    message: "Unknown error",
  };
  
  if (error instanceof Error) {
    result.message = redactString(error.message);
    result.stack = error.stack ? redactString(error.stack) : undefined;
  } else if (typeof error === "string") {
    result.message = redactString(error);
  } else if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    result.message = errObj.message 
      ? redactString(String(errObj.message))
      : "Unknown error";
    result.stack = errObj.stack 
      ? redactString(String(errObj.stack))
      : undefined;
    
    // Include other properties but redact them
    const context: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(errObj)) {
      if (key !== "message" && key !== "stack") {
        if (typeof value === "string") {
          context[key] = redactString(value);
        } else if (typeof value === "object" && value !== null) {
          context[key] = redactObject(value as Record<string, unknown>);
        } else {
          context[key] = value;
        }
      }
    }
    
    if (Object.keys(context).length > 0) {
      result.context = context;
    }
  }
  
  return result;
}

/**
 * Creates a redacting logger wrapper
 */
export function createRedactingLogger(logger: {
  info?: (msg: string, ...args: unknown[]) => void;
  warn?: (msg: string, ...args: unknown[]) => void;
  error?: (msg: string, ...args: unknown[]) => void;
  debug?: (msg: string, ...args: unknown[]) => void;
}) {
  return {
    info: (msg: string, ...args: unknown[]) => {
      const redactedArgs = args.map(arg => 
        typeof arg === "string" ? redactString(arg) :
        typeof arg === "object" && arg !== null ? redactObject(arg as Record<string, unknown>) :
        arg
      );
      logger.info?.(msg, ...redactedArgs);
    },
    warn: (msg: string, ...args: unknown[]) => {
      const redactedArgs = args.map(arg => 
        typeof arg === "string" ? redactString(arg) :
        typeof arg === "object" && arg !== null ? redactObject(arg as Record<string, unknown>) :
        arg
      );
      logger.warn?.(msg, ...redactedArgs);
    },
    error: (msg: string, ...args: unknown[]) => {
      const redactedArgs = args.map(arg => 
        typeof arg === "string" ? redactString(arg) :
        arg instanceof Error ? redactErrorLog(arg) :
        typeof arg === "object" && arg !== null ? redactObject(arg as Record<string, unknown>) :
        arg
      );
      logger.error?.(msg, ...redactedArgs);
    },
    debug: (msg: string, ...args: unknown[]) => {
      const redactedArgs = args.map(arg => 
        typeof arg === "string" ? redactString(arg) :
        typeof arg === "object" && arg !== null ? redactObject(arg as Record<string, unknown>) :
        arg
      );
      logger.debug?.(msg, ...redactedArgs);
    },
  };
}

/**
 * Checks if an object contains redacted values
 */
function hasRedactedValues(obj: Record<string, unknown>): boolean {
  for (const value of Object.values(obj)) {
    if (value === REDACTED) {
      return true;
    }
    if (typeof value === "string" && value.includes(REDACTED)) {
      return true;
    }
  }
  return false;
}

/**
 * Middleware to automatically redact request/response logs
 */
export function createLoggingMiddleware() {
  return {
    onRequest: (request: Request) => {
      return redactRequestLog(request);
    },
    onResponse: (status: number, headers: Headers) => {
      return redactResponseLog(status, headers);
    },
  };
}
