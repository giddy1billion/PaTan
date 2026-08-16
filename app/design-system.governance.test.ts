/**
 * Design-system governance test.
 *
 * Fails the build when raw color literals or hardcoded shadow definitions
 * leak back into source, so the token migration doesn't regress. Allowlist:
 *   - Third-party brand colors used inside OAuth icon fills (e.g. Facebook
 *     blue #1877F2, Google brand fill colors) — these are brand identities,
 *     not PaTan tokens.
 *   - rgba()/#hex inside CSS @theme/app.css definitions and keyframes.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'app');
const SCAN_DIRS = [join(ROOT, 'routes'), join(ROOT, 'components')];

/** Patterns that indicate a leaked raw color literal in className strings. */
const FORBIDDEN_PATTERNS: RegExp[] = [
  // text-[#abc123], bg-[#abc123], border-[#abc123] — except the allowlisted
  // OAuth brand colors below.
  /\b(text|bg|border|ring|fill|stroke)-\[#[0-9A-Fa-f]{6}\]/,
  // Hardcoded shadow utilities with rgba literals.
  /shadow-\[[^\]]*rgba\(/,
  // Opaque bg-white / bg-black (must use bg-surface / dark tokens).
  // Translucent variants like bg-white/10 are intentional glass overlays and
  // are allowed (the negative lookahead skips anything followed by `/`).
  /\bbg-white\b(?!\/)/,
  /\bbg-black\b(?!\/)/,
];

/** Per-file path substrings whose hex literals are intentional brand colors. */
const ALLOWLIST_PATHS = ['auth/login.tsx', 'auth/signup.tsx'];

/** Hex values that are third-party brand identities (never PaTan tokens). */
const ALLOWLIST_HEX = ['#1877F2'];

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (extname(full) === '.tsx' || extname(full) === '.ts') {
      acc.push(full);
    }
  }
  return acc;
}

function findViolations(): { file: string; line: number; text: string; pattern: string }[] {
  const violations: { file: string; line: number; text: string; pattern: string }[] = [];

  for (const dir of SCAN_DIRS) {
    const files = walk(dir);
    for (const file of files) {
      const rel = file.replace(ROOT + '/', '');
      const isAllowlistedFile = ALLOWLIST_PATHS.some((p) => rel.endsWith(p));
      const src = readFileSync(file, 'utf8').split('\n');

      src.forEach((lineText, idx) => {
        for (const pattern of FORBIDDEN_PATTERNS) {
          const match = lineText.match(pattern);
          if (!match) continue;

          // Allowlisted OAuth brand hex inside allowlisted files.
          if (isAllowlistedFile) {
            const hex = lineText.match(/#[0-9A-Fa-f]{6}/);
            if (hex && ALLOWLIST_HEX.includes(hex[0].toUpperCase())) continue;
          }

          violations.push({
            file: rel,
            line: idx + 1,
            text: lineText.trim(),
            pattern: match[0],
          });
        }
      });
    }
  }

  return violations;
}

describe('design-system governance', () => {
  it('does not reintroduce raw hex colors, bg-white/bg-black, or hardcoded rgba shadows in routes/components', () => {
    const violations = findViolations();
    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line}  [${v.pattern}]  ${v.text}`)
        .join('\n');
      throw new Error(
        `Found ${violations.length} raw-color/shadow literal(s). Use design tokens instead:\n${report}`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
