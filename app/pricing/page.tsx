import { PricingCards } from "@/components/PricingCards";
import { Disclaimer } from "@/components/Disclaimer";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Pricing</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Choose the right VAT estimate package</h1>
      <p className="mt-4 max-w-2xl text-slate-600">Start with a limited preview or unlock the full VAT estimate, transaction table, PDF report, Excel export, and specialist referral.</p>
      <div className="mt-10">
        <PricingCards />
      </div>
      <div className="mt-10">
        <Disclaimer />
      </div>
    </main>
  );
}
