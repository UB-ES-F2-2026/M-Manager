import type { ReactNode } from "react";
import FieldError from "./FieldError";
import { fieldErrorId } from "./inputClasses";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

/** Label + input slot + error message, shared by TextField and PasswordField. */
export default function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
      <FieldError id={fieldErrorId(id)} message={error} />
    </div>
  );
}
