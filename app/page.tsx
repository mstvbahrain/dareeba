import Link from "next/link";
import { ArrowRight, BadgeCheck, FileSearch, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { Section } from "@/components/Section";

export default function HomePage() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold">Bahrain VAT estimate</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">Check Your Bahrain VAT in Minutes</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Upload your invoices or import documents and get an AI-powered VAT estimate before speaking to a licensed Bahrain VAT specialist.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/upload" className="inline-flex items-center gap-2 rounded bg-gold px-5 py-3 font-semibold text-navy">
                Start VAT Check <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="rounded border border-white/30 px-5 py-3 font-semibold text-white">
                View Pricing
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/8 p-5 shadow-soft">
            <div className="rounded bg-white p-5 text-ink">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm text-slate-500">Potential Savings Meter</p>
                  <p className="text-2xl font-bold text-navy">BHD 1,240 - 2,750</p>
                </div>
                <BadgeCheck className="h-8 w-8 text-gold" />
              </div>
              <div className="mt-5 space-y-4">
                {["Estimated VAT due", "Possible recoverable VAT", "Possible savings", "Confidence score"].map((label, index) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-semibold">{[820, 640, 1240, "78%"][index]}</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100">
                      <div className="h-2 rounded bg-gold" style={{ width: `${[45, 55, 72, 78][index]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section title="How it works">
        <div className="grid gap-5 md:grid-cols-3">
          {([
            ["Upload", "Add invoices, receipts, import documents, CSV, or Excel files.", UploadCloud],
            ["Confirm", "Review extracted supplier, date, amount, VAT, category, and customs details.", FileSearch],
            ["Review", "See an estimate, possible recovery notes, and recommended professional next steps.", ShieldCheck]
          ] as Array<[string, string, LucideIcon]>).map(([title, body, Icon]) => (
            <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-6">
              <Icon className="h-7 w-7 text-gold" />
              <h3 className="mt-5 text-lg font-bold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What we check" className="bg-white">
        <div className="grid gap-4 md:grid-cols-5">
          {["Standard-rated", "Zero-rated", "Exempt", "Outside scope", "Needs professional review"].map((item) => (
            <div key={item} className="rounded border border-slate-200 p-4 text-sm font-semibold text-navy">
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Why use this service">
        <div className="grid gap-5 md:grid-cols-3">
          {["Quick preliminary view before a specialist call", "Clear risk flags when documents are incomplete", "Partner referral for Bahrain VAT and accounting review"].map((item) => (
            <div key={item} className="rounded-lg bg-navy p-6 text-white">
              <p className="text-lg font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Disclaimer" className="bg-white">
        <Disclaimer />
      </Section>
    </main>
  );
}
