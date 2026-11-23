import { useEffect, useRef, useState } from "react";

/** How long «Copiat!» stays visible after copying (US4.1 AC2). */
export const COPIED_FEEDBACK_MS = 2000;

export type CopyResult = "copied" | "failed";

/**
 * Copies text to the clipboard and reports it for a short while, so the UI
 * can show «Copiat!». Copying again restarts the countdown.
 * `result` is kept after `visible` turns false, so the message does not
 * change while it fades out.
 */
export function useCopyFeedback() {
  const [result, setResult] = useState<CopyResult>("copied");
  const [visible, setVisible] = useState(false);
  const timeoutId = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeoutId.current), []);

  async function copy(text: string) {
    window.clearTimeout(timeoutId.current);
    try {
      await navigator.clipboard.writeText(text);
      setResult("copied");
    } catch {
      // The clipboard is blocked without HTTPS or permission.
      setResult("failed");
    }
    setVisible(true);
    timeoutId.current = window.setTimeout(() => setVisible(false), COPIED_FEEDBACK_MS);
  }

  return { result, visible, copy };
}
