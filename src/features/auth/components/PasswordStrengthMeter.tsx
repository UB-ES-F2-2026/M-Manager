import {
  getPasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  REGISTER_MESSAGES,
  type PasswordStrengthLevel,
} from "../registerForm";

const LEVEL_CLASSES: Record<PasswordStrengthLevel, { bar: string; text: string }> = {
  weak: { bar: "bg-danger", text: "text-danger" },
  fair: { bar: "bg-warning", text: "text-warning" },
  good: { bar: "bg-warning", text: "text-warning" },
  strong: { bar: "bg-success", text: "text-success" },
};

const SEGMENTS = [1, 2, 3, 4];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, level } = getPasswordStrength(password);
  const classes = LEVEL_CLASSES[level];
  const filled = Math.max(score, 1);
  const label = PASSWORD_STRENGTH_LABELS[level];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full ${segment <= filled ? classes.bar : "bg-line"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${classes.text}`} aria-live="polite">
        {level === "strong"
          ? label
          : `${label} · ${REGISTER_MESSAGES.passwordHint.toLowerCase()}`}
      </p>
    </div>
  );
}
