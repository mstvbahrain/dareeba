import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const plan = await prisma.pricingPlan.findUnique({ where: { key: body.planKey } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      reportId: body.reportId,
      planKey: plan.key,
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: plan.priceCents === 0 ? "PAID" : "PENDING"
    }
  });

  if (!process.env.STRIPE_SECRET_KEY || plan.priceCents === 0) {
    if (body.reportId) await prisma.report.update({ where: { id: body.reportId }, data: { status: "PAID" } });
    return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/results/${body.reportId}`, paymentId: payment.id });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: plan.key === "monthly-business" ? "subscription" : "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/results/${body.reportId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency.toLowerCase(),
          unit_amount: plan.priceCents,
          product_data: { name: `Dareeba ${plan.name}` },
          recurring: plan.key === "monthly-business" ? { interval: "month" } : undefined
        }
      }
    ],
    metadata: { reportId: body.reportId, paymentId: payment.id, planKey: plan.key }
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { providerSessionId: session.id } });
  return NextResponse.json({ url: session.url });
}
