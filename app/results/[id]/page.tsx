import Link from "next/link";
import { Download, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { UnlockButton } from "@/components/UnlockButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { transactions: true, files: true }
  });
  if (!report) notFound();

  const unlocked = report.status === "PAID" || report.status === "REFERRED";
  const savingsRange = `${money(report.possibleSavingsLow)} - ${money(report.possibleSavingsHigh)}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">Results</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">VAT estimate report</h1>
          <p className="mt-3 text-slate-600">Report reference: {report.id}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {unlocked ? (
            <>
              <a href={`/api/reports/${report.id}/pdf`} className="inline-flex items-center gap-2 rounded bg-navy px-4 py-3 text-sm font-semibold text-white">
                <Download className="h-4 w-4" /> PDF report
              </a>
              <a href={`/api/reports/${report.id}/excel`} className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-navy">
                <Download className="h-4 w-4" /> Excel export
              </a>
            </>
          ) : (
            <UnlockButton reportId={report.id} planKey={report.planKey} />
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          ["Total uploaded value", money(report.uploadedValue), true],
          ["Estimated VAT due", money(report.estimatedVatDue), unlocked],
          ["Estimated recoverable VAT", money(report.estimatedRecoverable), unlocked],
          ["Possible exemption amount", money(report.possibleExemption), unlocked]
        ].map(([label, value, visible]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold text-navy ${visible ? "" : "blur-lock"}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-bold text-navy">Potential Savings Meter</h2>
            <p className="mt-2 text-sm text-slate-600">Preliminary estimate only. Professional review recommended before making VAT decisions.</p>
            <div className="mt-5 space-y-4">
              {[
                ["Estimated VAT due", money(report.estimatedVatDue), 52],
                ["Possible recoverable VAT", money(report.estimatedRecoverable), 64],
                ["Possible savings", savingsRange, 72],
                ["Confidence score", `${report.confidenceScore}%`, report.confidenceScore]
              ].map(([label, value, width]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className={`font-semibold ${unlocked ? "" : "blur-lock"}`}>{value}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div className="h-2 rounded bg-gold" style={{ width: `${width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Risk level</p>
            <p className="mt-1 text-3xl font-bold text-navy">{report.riskLevel}</p>
            <p className={`mt-4 text-slate-700 ${unlocked ? "" : "blur-lock"}`}>{report.recommendedNextStep}</p>
            {!unlocked && <p className="mt-4 text-sm font-semibold text-gold">Full VAT calculations, recovery notes, exemption details, and recommendations are locked until payment.</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-bold text-navy">Transaction table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["Supplier", "Invoice no.", "Invoice date", "Description", "Subtotal", "VAT amount", "Total", "VAT classification", "Confidence", "Reasoning", "Warning"].map((head) => (
                  <th key={head} className="px-4 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.transactions.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{item.supplierName || "Unknown"}</td>
                  <td className="px-4 py-3">{item.invoiceNumber || "Not found"}</td>
                  <td className="px-4 py-3">{item.invoiceDate ? item.invoiceDate.toISOString().slice(0, 10) : "Not found"}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className={`px-4 py-3 ${unlocked ? "" : "blur-lock"}`}>{money(item.amountBeforeVat)} {item.currency}</td>
                  <td className={`px-4 py-3 ${unlocked ? "" : "blur-lock"}`}>{money(item.vatAmount)}</td>
                  <td className={`px-4 py-3 ${unlocked ? "" : "blur-lock"}`}>{money(item.totalAmount)}</td>
                  <td className="px-4 py-3">{item.vatTreatment.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{item.confidenceScore}%</td>
                  <td className={`px-4 py-3 ${unlocked ? "" : "blur-lock"}`}>{item.reasoning}</td>
                  <td className="px-4 py-3 text-amber-700">{item.warning || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {unlocked && (
        <section className="mt-8 rounded-lg bg-navy p-6 text-white">
          <h2 className="text-2xl font-bold">Would you like a Bahrain VAT specialist to review this?</h2>
          <p className="mt-2 text-slate-200">Send this report reference to a Bahrain VAT/accounting partner for professional review.</p>
          <Link href={`/referral/${report.id}`} className="mt-5 inline-flex items-center gap-2 rounded bg-gold px-4 py-3 font-semibold text-navy">
            <Send className="h-4 w-4" /> Request specialist review
          </Link>
        </section>
      )}

      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </main>
  );
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
