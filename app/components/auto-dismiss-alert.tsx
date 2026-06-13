import { useEffect, useMemo, useState } from "react";

type AlertTone = "error" | "success" | "info";

type AutoDismissAlertProps = {
  message?: string | null;
  tone?: AlertTone;
  timeoutMs?: number;
  className?: string;
};

const toneStyles: Record<AlertTone, string> = {
  error: "border-[#F59E0B]/40 bg-[#FEF3C7]/70 text-[#7C2D12]",
  success: "border-forest/30 bg-[#ECF9F0] text-forest",
  info: "border-midnight/20 bg-sky-reflection/80 text-midnight",
};

export function AutoDismissAlert({
  message,
  tone = "info",
  timeoutMs = 7000,
  className = "",
}: AutoDismissAlertProps) {
  const normalizedMessage = message?.trim() ?? "";
  const [isVisible, setIsVisible] = useState(Boolean(normalizedMessage));
  const [remainingMs, setRemainingMs] = useState(timeoutMs);

  const totalSeconds = useMemo(
    () => Math.max(1, Math.ceil(timeoutMs / 1000)),
    [timeoutMs],
  );

  useEffect(() => {
    setIsVisible(Boolean(normalizedMessage));
    setRemainingMs(timeoutMs);

    if (!normalizedMessage) {
      return;
    }

    const dismissTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, timeoutMs);

    const countdownTimer = window.setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - 1000));
    }, 1000);

    return () => {
      window.clearTimeout(dismissTimer);
      window.clearInterval(countdownTimer);
    };
  }, [normalizedMessage, timeoutMs]);

  if (!normalizedMessage || !isVisible) {
    return null;
  }

  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const role = tone === "error" ? "alert" : "status";
  const ariaLive = tone === "error" ? "assertive" : "polite";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${toneStyles[tone]} ${className}`}
      role={role}
      aria-live={ariaLive}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="leading-relaxed">{normalizedMessage}</p>
        <div className="flex items-center gap-2 sm:shrink-0">
          <span className="text-xs opacity-80" aria-label={`Closes in ${secondsLeft} seconds`}>
            Closes in {secondsLeft}s
          </span>
          <button
            type="button"
            className="min-h-[32px] rounded-lg border border-current/25 px-2.5 text-xs font-semibold hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss alert"
          >
            Dismiss
          </button>
        </div>
      </div>
      <p className="sr-only">This alert auto-dismisses after {totalSeconds} seconds.</p>
    </div>
  );
}
