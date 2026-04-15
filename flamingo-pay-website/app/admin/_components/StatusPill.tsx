import type { MerchantStatus } from "../../../lib/store";

export function StatusPill({ status }: { status: MerchantStatus }) {
  const map = {
    approved: { label: "Approved", cls: "bg-flamingo-mint text-flamingo-dark" },
    pending: { label: "Pending", cls: "bg-flamingo-butter text-flamingo-dark" },
    rejected: {
      label: "Rejected",
      cls: "bg-flamingo-pink-soft text-flamingo-pink-deep",
    },
    suspended: { label: "Suspended", cls: "bg-flamingo-dark text-white" },
  }[status];
  return (
    <span
      className={
        "inline-block rounded-full border-2 border-flamingo-dark px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide " +
        map.cls
      }
    >
      {map.label}
    </span>
  );
}
