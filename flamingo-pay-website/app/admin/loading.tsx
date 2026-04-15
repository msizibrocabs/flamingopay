export default function AdminLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-flamingo-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-dark shadow-[0_4px_0_0_#000] animate-pulse">
          <span className="display text-2xl font-extrabold text-flamingo-pink">F</span>
        </div>
        <span className="text-sm font-semibold text-flamingo-dark/60">
          Loading admin…
        </span>
      </div>
    </div>
  );
}
