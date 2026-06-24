/* eslint-disable @next/next/no-img-element */
// Shared full-screen loading state. Originally the AI Access "checking key"
// spinner, now the common loader behind every page's dynamic-import fallback so
// loading feels like one product. Pass `label` to brand a specific surface
// (e.g. "AI ACCESS"); defaults to "TOKI".
export default function TokiLoader({ label = "TOKI" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#070b14]">
      <img
        src="/characters/toki-loading.png"
        alt=""
        className="w-56 max-w-[70vw] object-contain animate-pulse drop-shadow-[0_10px_34px_rgba(34,211,238,0.22)]"
      />
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan" />
      <div className="text-[11px] font-bold tracking-[0.2em] text-accent-cyan/70">{label}</div>
    </div>
  );
}
