import type { FlagStatus } from "../../../lib/store";

const COLORS: Record<FlagStatus, string> = {
  open: "bg-red-100 text-red-800 border-red-300",
  investigating: "bg-amber-100 text-amber-800 border-amber-300",
  cleared: "bg-green-100 text-green-800 border-green-300",
  confirmed: "bg-purple-100 text-purple-800 border-purple-300",
};

const LABELS: Record<FlagStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  cleared: "Cleared",
  confirmed: "Confirmed fraud",
};

export function FlagPill({ status }: { status: FlagStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
