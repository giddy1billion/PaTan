import { describe, expect, it, vi } from "vitest";

vi.mock("~/utils/db.server", () => ({
  db: {},
  pool: {},
}));

import { shouldRevalidate } from "~/routes/dashboard";

function revalidateArgs(
  currentUrl: string,
  nextUrl: string,
  options?: {
    defaultShouldRevalidate?: boolean;
    formMethod?: string;
  },
) {
  return {
    currentUrl: new URL(currentUrl),
    nextUrl: new URL(nextUrl),
    defaultShouldRevalidate: options?.defaultShouldRevalidate ?? true,
    formMethod: options?.formMethod,
  } as any;
}

describe("Dashboard shouldRevalidate", () => {
  it("skips loader revalidation when only activity tab changes", () => {
    const result = shouldRevalidate(
      revalidateArgs(
        "http://localhost/dashboard?activity=all&range=30d",
        "http://localhost/dashboard?activity=notifications&range=30d",
      ),
    );

    expect(result).toBe(false);
  });

  it("revalidates when range tab changes", () => {
    const result = shouldRevalidate(
      revalidateArgs(
        "http://localhost/dashboard?activity=all&range=30d",
        "http://localhost/dashboard?activity=all&range=7d",
      ),
    );

    expect(result).toBe(true);
  });

  it("revalidates when both activity and range tabs change", () => {
    const result = shouldRevalidate(
      revalidateArgs(
        "http://localhost/dashboard?activity=stories&range=30d",
        "http://localhost/dashboard?activity=notifications&range=90d",
      ),
    );

    expect(result).toBe(true);
  });

  it("falls back to default behavior for unrelated query changes", () => {
    const result = shouldRevalidate(
      revalidateArgs(
        "http://localhost/dashboard?activity=all&range=30d",
        "http://localhost/dashboard?activity=all&range=30d&page=2",
        { defaultShouldRevalidate: true },
      ),
    );

    expect(result).toBe(true);
  });

  it("falls back to default behavior for non-GET submissions", () => {
    const result = shouldRevalidate(
      revalidateArgs(
        "http://localhost/dashboard?activity=all&range=30d",
        "http://localhost/dashboard?activity=notifications&range=30d",
        { defaultShouldRevalidate: true, formMethod: "post" },
      ),
    );

    expect(result).toBe(true);
  });
});
