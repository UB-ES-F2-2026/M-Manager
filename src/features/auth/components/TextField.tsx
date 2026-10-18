import type { InputHTMLAttributes } from "react";
import FormField from "./FormField";
import { fieldErrorId, inputClasses } from "./inputClasses";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
};

/** Labelled input with an optional error message below it. */
export default function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  return (
    <FormField id={id} label={label} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? fieldErrorId(id) : undefined}
        className={inputClasses(Boolean(error))}
        {...inputProps}
      />
    </FormField>
  );
}
