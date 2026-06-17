import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { pricingPlans } from "@/lib/plans";

export function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-4">
      {pricingPlans.map((plan) => (
        <article key={plan.key} className="flex min-h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-navy">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold text-ink">{plan.price}</p>
            <p className="mt-3 text-sm text-slate-600">{plan.summary}</p>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{feature}</span>
              </li>
            ))}
            {plan.hidden?.map((feature) => (
              <li key={feature} className="flex gap-2 text-slate-500">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Hide {feature.toLowerCase()}</span>
              </li>
            ))}
          </ul>
          <Link href={`/upload?plan=${plan.key}`} className="mt-8 rounded bg-navy px-4 py-3 text-center text-sm font-semibold text-white">
            {plan.key === "free-preview" ? "Start Free Preview" : "Choose Plan"}
          </Link>
          {plan.cta && <p className="mt-3 text-xs font-semibold text-gold">{plan.cta}</p>}
        </article>
      ))}
    </div>
  );
}
