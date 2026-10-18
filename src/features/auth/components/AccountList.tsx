import { PlusIcon } from "../../../components/ui/icons";
import { formatMoney } from "../../../lib/money";
import type { SampleAccount } from "../homeSampleData";

/** "Els meus comptes": one row per bank account and the connect-bank button. */
export default function AccountList({ accounts }: { accounts: SampleAccount[] }) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
            >
              {account.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{account.bankName}</p>
              <p className="text-xs text-slate-500">
                {account.kind} · ••{account.lastDigits}
              </p>
            </div>
            <p className="font-semibold text-slate-900">{formatMoney(account.balanceCents)}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        title="Properament"
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-primary disabled:cursor-not-allowed"
      >
        <PlusIcon className="size-4" />
        Connectar un altre banc
      </button>
    </div>
  );
}
