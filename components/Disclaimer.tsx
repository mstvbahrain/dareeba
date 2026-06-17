import { disclaimer } from "@/lib/disclaimer";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" : "rounded border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"}>
      <strong>Important:</strong> {disclaimer}
    </div>
  );
}
