import { useId } from "react";
import { ASSET_TYPES, type AssetType } from "../../../../convex/lib/assetTypes";
import { ASSET_TYPE_LABELS } from "../assetTypeLabels";

type AssetTypeFieldProps = {
  value: AssetType | "";
  onChange: (value: AssetType | "") => void;
  error?: string;
  disabled?: boolean;
};

/** Asset type dropdown with the same look as TextField. */
export default function AssetTypeField({ value, onChange, error, disabled }: AssetTypeFieldProps) {
  const selectId = useId();
  const messageId = `${selectId}-message`;
  const borderClasses = error ? "border-danger" : "border-slate-300 focus:border-primary";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-900">
        Tipus d'actiu
      </label>
      <select
        id={selectId}
        name="assetType"
        value={value}
        onChange={(event) => onChange(event.target.value as AssetType | "")}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? messageId : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 ${borderClasses} ${
          value === "" ? "text-slate-400" : "text-slate-900"
        }`}
      >
        <option value="" disabled>
          Tria un tipus
        </option>
        {ASSET_TYPES.map((type) => (
          <option key={type} value={type} className="text-slate-900">
            {ASSET_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      {error && (
        <p id={messageId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
