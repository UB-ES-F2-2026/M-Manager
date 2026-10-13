import type { ReactNode } from "react";

type AlertTone = "danger" | "warning" | "success" | "info";

type AlertProps = {
  tone: AlertTone;
  title: string;
  children?: ReactNode;
};

const TONE_CLASSES: Record<AlertTone, { box: string; icon: string; title: string }> = {
  danger: {
    box: "border-danger-strong/60 bg-danger-soft",
    icon: "bg-danger",
    title: "text-danger",
  },
  warning: {
    box: "border-warning/50 bg-warning-soft",
    icon: "bg-warning",
    title: "text-warning",
  },
  success: {
    box: "border-success/40 bg-success-soft",
    icon: "bg-success",
    title: "text-success",
  },
  info: {
    box: "border-brand/30 bg-brand-soft",
    icon: "bg-brand",
    title: "text-brand",
  },
};

const TONE_SYMBOL: Record<AlertTone, string> = {
  danger: "!",
  warning: "!",
  success: "✓",
  info: "i",
};

/** Global (non field-specific) message shown above a form. */
export function Alert({ tone, title, children }: AlertProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex gap-3 rounded-lg border px-4 py-3 ${classes.box}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${classes.icon}`}
      >
        {TONE_SYMBOL[tone]}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className={`text-sm font-medium ${classes.title}`}>{title}</p>
        {children ? <div className="text-xs text-ink">{children}</div> : null}
      </div>
    </div>
  );
}
