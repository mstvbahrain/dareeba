"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export function UnlockButton({ reportId, planKey }: { reportId: string; planKey: string }) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, planKey: planKey === "free-preview" ? "basic-scan" : planKey })
    });
    const data = await response.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <button onClick={checkout} disabled={loading} className="inline-flex items-center gap-2 rounded bg-gold px-4 py-3 text-sm font-semibold text-navy disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      Unlock full report
    </button>
  );
}
