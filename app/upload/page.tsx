"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileUp, Loader2 } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { pricingPlans } from "@/lib/plans";

type ExtractedItem = {
  supplierName?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  description: string;
  amountBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  category?: string;
  customsReference?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [planKey, setPlanKey] = useState("free-preview");
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [draftId, setDraftId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const plan = useMemo(() => pricingPlans.find((item) => item.key === planKey) ?? pricingPlans[0], [planKey]);

  useEffect(() => {
    setPlanKey(new URLSearchParams(window.location.search).get("plan") || "free-preview");
  }, []);

  async function upload() {
    setError("");
    if (!files.length) {
      setError("Please choose at least one file.");
      return;
    }
    if (files.length > plan.fileLimit) {
      setError(`${plan.name} allows up to ${plan.fileLimit} file${plan.fileLimit === 1 ? "" : "s"}.`);
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.set("planKey", plan.key);
    form.set("businessName", businessName);
    files.forEach((file) => form.append("files", file));
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    setDraftId(data.reportId);
    setItems(data.items);
  }

  async function calculate() {
    setLoading(true);
    const response = await fetch(`/api/reports/${draftId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, businessName, planKey: plan.key })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Calculation failed.");
      return;
    }
    router.push(`/results/${draftId}`);
  }

  function update(index: number, key: keyof ExtractedItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: ["amountBeforeVat", "vatAmount", "totalAmount"].includes(key) ? Number(value) : value
            }
          : item
      )
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Upload</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Upload VAT documents</h1>
      <p className="mt-4 max-w-2xl text-slate-600">Accepted formats: PDF, JPG, PNG, CSV, and Excel. You can confirm or edit extracted data before the estimate is calculated.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-navy">{plan.name}</h2>
          <p className="mt-2 text-sm text-slate-600">File limit: {plan.fileLimit}</p>
          <label className="mt-6 block text-sm font-semibold text-slate-700">User/business name</label>
          <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="mt-2 w-full rounded border border-slate-300 px-3 py-2" placeholder="Example Trading W.L.L." />
          <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <FileUp className="h-9 w-9 text-gold" />
            <span className="mt-3 font-semibold text-navy">Choose files</span>
            <span className="mt-1 text-sm text-slate-500">PDF, JPG, PNG, CSV, XLS, XLSX</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {files.map((file) => (
              <div key={`${file.name}-${file.size}`} className="rounded border border-slate-200 px-3 py-2">
                {file.name}
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <button onClick={upload} disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-navy px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Extract data
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-navy">Confirm extracted data</h2>
          <p className="mt-2 text-sm text-slate-600">Edit any field before calculation. This helps reduce unclear document warnings.</p>
          <div className="mt-5 space-y-5">
            {items.length === 0 && <div className="rounded bg-slate-50 p-6 text-sm text-slate-500">Extracted rows will appear here.</div>}
            {items.map((item, index) => (
              <div key={index} className="rounded border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {(["supplierName", "invoiceDate", "invoiceNumber", "currency", "category", "customsReference"] as const).map((key) => (
                    <label key={key} className="text-xs font-semibold uppercase text-slate-500">
                      {key.replace(/([A-Z])/g, " $1")}
                      <input value={String(item[key] ?? "")} onChange={(event) => update(index, key, event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case text-ink" />
                    </label>
                  ))}
                </div>
                <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">
                  Description
                  <textarea value={item.description} onChange={(event) => update(index, "description", event.target.value)} className="mt-1 min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case text-ink" />
                </label>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(["amountBeforeVat", "vatAmount", "totalAmount"] as const).map((key) => (
                    <label key={key} className="text-xs font-semibold uppercase text-slate-500">
                      {key.replace(/([A-Z])/g, " $1")}
                      <input type="number" value={item[key]} onChange={(event) => update(index, key, event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case text-ink" />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={calculate} disabled={loading || !draftId || !items.length} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-gold px-4 py-3 font-semibold text-navy disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calculate VAT estimate
          </button>
        </section>
      </div>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </main>
  );
}
