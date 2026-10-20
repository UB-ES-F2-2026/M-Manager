import {
  getPasswordStrength,
  MIN_PASSWORD_LENGTH,
  type PasswordStrength,
} from "../../../lib/passwordStrength";

const SEGMENTS = [1, 2, 3, 4] as const;

const COLORS: Record<Exclude<PasswordStrength, 0>, { bar: string; text: string }> = {
  1: { bar: "bg-danger", text: "text-danger" },
  2: { bar: "bg-strength-2", text: "text-strength-2" },
  3: { bar: "bg-strength-3", text: "text-strength-3" },
  4: { bar: "bg-success", text: "text-success" },
};

/**
 * Four-segment bar under the password field. Shows the requirements while
 * empty, "Feble" (red, less red as more rules are met) and "Forta" (green)
 * once every rule is met.
 */
export default function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  if (strength === 0) {
    return <span>{`Mínim ${MIN_PASSWORD_LENGTH} caràcters, amb majúscula, número i símbol`}</span>;
  }

  const isStrong = strength === 4;
  const { bar: barColor, text: textColor } = COLORS[strength];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full ${segment <= strength ? barColor : "bg-slate-200"}`}
          />
        ))}
      </div>
      {isStrong ? (
        <span aria-live="polite" className={textColor}>
          Forta
        </span>
      ) : (
        <span aria-live="polite" className={textColor}>
          {`Feble · fes servir ${MIN_PASSWORD_LENGTH}+ caràcters, majúscula, número i símbol`}
        </span>
      )}
    </div>
  );
}
