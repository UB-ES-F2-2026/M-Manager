import { useState, type InputHTMLAttributes } from "react";
import FormField from "./FormField";
import { fieldErrorId, inputClasses } from "./inputClasses";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: string;
  error?: string;
};

/** Password input with a "Mostrar / Amagar" toggle. */
export default function PasswordField({
  id,
  label,
  error,
  disabled,
  ...inputProps
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormField id={id} label={label} error={error}>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? fieldErrorId(id) : undefined}
          className={`${inputClasses(Boolean(error))} pr-20`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          disabled={disabled}
          aria-controls={id}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-blue-800 disabled:text-slate-400"
        >
          {isVisible ? "Amagar" : "Mostrar"}
        </button>
      </div>
    </FormField>
  );
}
