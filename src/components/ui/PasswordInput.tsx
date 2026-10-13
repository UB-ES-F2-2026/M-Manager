import { useState, type ComponentProps } from "react";
import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "trailing">;

export function PasswordInput({ disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          disabled={disabled}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="text-sm font-medium text-brand hover:text-brand-strong disabled:text-subtle"
        >
          {visible ? "Amagar" : "Mostrar"}
        </button>
      }
    />
  );
}
