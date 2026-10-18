import { useState, type ComponentProps } from "react";
import TextField from "./TextField";

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

/** TextField for passwords with a "Mostrar / Amagar" toggle. */
export default function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={props.disabled}
          aria-pressed={visible}
          className="shrink-0 px-3 text-xs font-semibold text-primary disabled:text-slate-400"
        >
          {visible ? "Amagar" : "Mostrar"}
        </button>
      }
    />
  );
}
