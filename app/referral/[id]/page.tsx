"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";

export default function ReferralPage() {
  const params = useParams<{ id: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    const response = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: params.id,
        name: formData.get("name"),
        companyName: formData.get("companyName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        vatIssueType: formData.get("vatIssueType"),
        preferredContactMethod: formData.get("preferredContactMethod")
      })
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Could not submit referral.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Partner referral</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Would you like a Bahrain VAT specialist to review this?</h1>
      <p className="mt-4 text-slate-600">Complete the form and the report reference will be sent to the partner workflow.</p>

      {submitted ? (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-green-900">
          <CheckCircle className="h-8 w-8" />
          <h2 className="mt-3 text-xl font-bold">Referral submitted</h2>
          <p className="mt-2">Your request has been saved. A Bahrain VAT specialist partner can now review the report reference and contact you.</p>
          <Link href={`/results/${params.id}`} className="mt-5 inline-block rounded bg-navy px-4 py-3 text-sm font-semibold text-white">
            Back to report
          </Link>
        </div>
      ) : (
        <form action={submit} className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Name", "text"],
              ["companyName", "Company name", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone number", "tel"]
            ].map(([name, label, type]) => (
              <label key={name} className="text-sm font-semibold text-slate-700">
                {label}
                <input name={name} type={type} required={name !== "companyName"} className="mt-2 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
            ))}
            <label className="text-sm font-semibold text-slate-700">
              Type of VAT issue
              <select name="vatIssueType" className="mt-2 w-full rounded border border-slate-300 px-3 py-2">
                <option>Input VAT recovery</option>
                <option>Import VAT</option>
                <option>Exemption or zero-rating</option>
                <option>Unclear invoice treatment</option>
                <option>Other Bahrain VAT issue</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Preferred contact method
              <select name="preferredContactMethod" className="mt-2 w-full rounded border border-slate-300 px-3 py-2">
                <option>Email</option>
                <option>Phone</option>
                <option>WhatsApp</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Uploaded report reference
            <input value={params.id} readOnly className="mt-2 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2" />
          </label>
          {error && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-gold px-4 py-3 font-semibold text-navy disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit referral
          </button>
        </form>
      )}
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </main>
  );
}
