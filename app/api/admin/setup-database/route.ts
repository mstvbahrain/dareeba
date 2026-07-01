import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupDatabase } from "@/lib/database-setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await setupDatabase();

  const [pricingPlans, vatRules] = await Promise.all([prisma.pricingPlan.count(), prisma.vatRule.count()]);
  return NextResponse.json({
    ok: true,
    message: "Fintyl database tables and seed data are ready.",
    pricingPlans,
    vatRules
  });
}
