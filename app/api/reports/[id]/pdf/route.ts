import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPdfReport } from "@/lib/reports";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, include: { transactions: true } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report.status !== "PAID" && report.status !== "REFERRED") {
    return NextResponse.json({ error: "Payment required to download this report." }, { status: 402 });
  }
  const pdf = await createPdfReport(report);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dareeba-${report.id}.pdf"`
    }
  });
}
