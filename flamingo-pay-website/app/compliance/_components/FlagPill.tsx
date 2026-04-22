import type { FlagStatus } from "../../../lib/store";
import { FLAG_STATUS_COLORS, FLAG_STATUS_LABELS } from "../../../lib/compliance-ui";

// Labels + colours are defined in lib/compliance-ui.ts to keep the FICA
// surfaces (flags, STRs, EDD, CTRs) in sync.

export function FlagPill({ status }: { status: FlagStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${FLAG_STATUS_COLORS[status]}`}
    >
      {FLAG_STATUS_LABELS[status]}
    </span>
  );
}
