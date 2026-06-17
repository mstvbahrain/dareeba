import { Disclaimer } from "@/components/Disclaimer";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Terms and privacy</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Terms, disclaimer, and privacy notice</h1>
      <div className="mt-8 space-y-6 text-slate-700">
        <Disclaimer />
        <section>
          <h2 className="text-xl font-bold text-navy">Use of estimates</h2>
          <p className="mt-2">Dareeba produces preliminary VAT estimates using uploaded documents, configured VAT rules, and optional AI analysis. Results may be incomplete or inaccurate if documents are unclear, missing, duplicated, or outside the configured rule examples.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">Professional review</h2>
          <p className="mt-2">Qualified users may request review by a Bahrain VAT/accounting partner. A partner review is separate from the automated estimate and may require additional documents and engagement terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">Privacy and files</h2>
          <p className="mt-2">Uploaded files are stored outside the public website path. Access should be limited to authorized users and administrators. Production deployments should use private object storage, encryption, retention rules, and signed access URLs.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">Payments</h2>
          <p className="mt-2">Paid reports unlock fuller estimates, reports, and referral options. Stripe keys must be configured with webhook handling before accepting live payments.</p>
        </section>
      </div>
    </main>
  );
}
