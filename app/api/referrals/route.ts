import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyPartnerLead } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const leadSchema = z.object({
  reportId: z.string(),
  name: z.string().min(2),
  companyName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(6),
  vatIssueType: z.string().min(2),
  preferredContactMethod: z.string().min(2)
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`lead:${request.headers.get("x-forwarded-for") ?? "local"}`);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const payload = leadSchema.parse(await request.json());
  const lead = await prisma.referralLead.create({
    data: {
      ...payload,
      referralFee: 0,
      percentageCommission: 10,
      totalExpectedCommission: 0
    }
  });
  await prisma.report.update({ where: { id: payload.reportId }, data: { status: "REFERRED" } });
  const email = await notifyPartnerLead(payload);
  if (email.sent) {
    await prisma.referralLead.update({ where: { id: lead.id }, data: { status: "SENT_TO_PARTNER" } });
  }
  return NextResponse.json({ ok: true, leadId: lead.id, email });
}
