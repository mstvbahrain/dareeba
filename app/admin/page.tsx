import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [reports, leads, payments, rules, plans, fileCount] = await Promise.all([
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { transactions: true, files: true } }),
    prisma.referralLead.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.vatRule.findMany({ orderBy: { key: "asc" } }),
    prisma.pricingPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.uploadedFile.count()
  ]);
  const totalExpectedCommission = leads.reduce((total, lead) => total + Number(lead.totalExpectedCommission), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Admin</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Dareeba dashboard</h1>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          ["User reports", reports.length],
          ["Uploaded file count", fileCount],
          ["Payments", payments.length],
          ["Leads sent to partner", leads.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-navy">{String(value)}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-navy">Commission tracking</h2>
        <p className="mt-2 text-slate-600">Total expected commission: <strong>{money(totalExpectedCommission)}</strong></p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>{["Lead", "Status", "Referral fee", "Percentage", "Expected commission", "Paid"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{lead.name}<br /><span className="text-slate-500">{lead.email}</span></td>
                  <td className="px-4 py-3">{lead.status.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{money(lead.referralFee)}</td>
                  <td className="px-4 py-3">{Number(lead.percentageCommission)}%</td>
                  <td className="px-4 py-3">{money(lead.totalExpectedCommission)}</td>
                  <td className="px-4 py-3">{lead.commissionPaid ? "Paid" : "Unpaid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-navy">VAT rules editor</h2>
          <p className="mt-2 text-sm text-slate-600">Update JSON values, then submit. These rules guide AI and fallback classification.</p>
          <div className="mt-5 space-y-4">
            {rules.map((rule) => (
              <form key={rule.id} action={`/api/admin/rules/${rule.id}`} method="post" className="rounded border border-slate-200 p-4">
                <label className="text-sm font-bold text-navy">{rule.title}</label>
                <textarea name="value" defaultValue={JSON.stringify(rule.value, null, 2)} className="mt-2 min-h-28 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs" />
                <button className="mt-3 rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Save rule</button>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-navy">Pricing editor</h2>
          <p className="mt-2 text-sm text-slate-600">Adjust plan price and file limits.</p>
          <div className="mt-5 space-y-4">
            {plans.map((plan) => (
              <form key={plan.id} action={`/api/admin/pricing/${plan.id}`} method="post" className="rounded border border-slate-200 p-4">
                <p className="font-bold text-navy">{plan.name}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Price cents<input name="priceCents" type="number" defaultValue={plan.priceCents} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case text-ink" /></label>
                  <label className="text-xs font-semibold uppercase text-slate-500">File limit<input name="fileLimit" type="number" defaultValue={plan.fileLimit} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case text-ink" /></label>
                </div>
                <button className="mt-3 rounded bg-navy px-4 py-2 text-sm font-semibold text-white">Save pricing</button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-navy">Recent reports</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>{["Reference", "Plan", "Files", "Risk", "Uploaded value", "Status"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{report.id}</td>
                  <td className="px-4 py-3">{report.planKey}</td>
                  <td className="px-4 py-3">{report.files.length}</td>
                  <td className="px-4 py-3">{report.riskLevel}</td>
                  <td className="px-4 py-3">{money(report.uploadedValue)}</td>
                  <td className="px-4 py-3">{report.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
