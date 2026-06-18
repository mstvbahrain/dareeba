import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { classifyConfirmedTransactions, summarize } from "@/lib/analysis";
import { rateLimit } from "@/lib/rate-limit";

const optionalString = z.preprocess((value) => (value === null ? undefined : value), z.string().optional());

const itemSchema = z.object({
  supplierName: optionalString,
  invoiceDate: optionalString,
  invoiceNumber: optionalString,
  description: z.string().min(1),
  amountBeforeVat: z.number().default(0),
  vatAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  currency: z.string().default("BHD"),
  category: optionalString,
  customsReference: optionalString,
  vatTreatment: z.enum(["STANDARD_RATED", "ZERO_RATED", "EXEMPT", "OUTSIDE_SCOPE", "NEEDS_REVIEW"]).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  reasoning: optionalString,
  warning: optionalString
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`confirm:${request.headers.get("x-forwarded-for") ?? "local"}`);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const { id } = await params;
  const body = await request.json();
  const parsed = z.object({ items: z.array(itemSchema).min(1), businessName: z.string().optional(), planKey: z.string().optional() }).parse(body);
  const analyzed = classifyConfirmedTransactions(parsed.items);
  const summary = summarize(analyzed);

  await prisma.transaction.deleteMany({ where: { reportId: id } });
  await prisma.report.update({
    where: { id },
    data: {
      businessName: parsed.businessName,
      planKey: parsed.planKey,
      status: "PREVIEW",
      uploadedValue: summary.uploadedValue,
      estimatedVatDue: summary.estimatedVatDue,
      estimatedRecoverable: summary.estimatedRecoverable,
      possibleExemption: summary.possibleExemption,
      possibleSavingsLow: summary.possibleSavingsLow,
      possibleSavingsHigh: summary.possibleSavingsHigh,
      confidenceScore: summary.confidenceScore,
      riskLevel: summary.riskLevel,
      recommendedNextStep: summary.recommendedNextStep,
      transactions: {
        create: analyzed.map((item) => ({
          supplierName: item.supplierName,
          invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : undefined,
          invoiceNumber: item.invoiceNumber,
          description: item.description,
          amountBeforeVat: item.amountBeforeVat,
          vatAmount: item.vatAmount,
          totalAmount: item.totalAmount,
          currency: item.currency,
          category: item.category,
          customsReference: item.customsReference,
          vatTreatment: item.vatTreatment,
          confidenceScore: item.confidenceScore,
          reasoning: item.reasoning,
          warning: item.warning
        }))
      }
    }
  });

  return NextResponse.json({ ok: true });
}
