import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeTransactions } from "@/lib/analysis";
import { assertSupportedFile, extractTextFromFile } from "@/lib/extract";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request.headers.get("x-forwarded-for") ?? "local");
  if (!limited.ok) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const form = await request.formData();
  const planKey = String(form.get("planKey") || "free-preview");
  const businessName = String(form.get("businessName") || "");
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const plan = await prisma.pricingPlan.findUnique({ where: { key: planKey } });
  const fileLimit = plan?.fileLimit ?? (planKey === "free-preview" ? 1 : 5);

  if (!files.length) return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  if (files.length > fileLimit) return NextResponse.json({ error: `This package allows up to ${fileLimit} files.` }, { status: 400 });

  const report = await prisma.report.create({ data: { planKey, businessName, status: "PREVIEW" } });
  const uploadRoot = process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/dareeba/uploads" : path.join(process.cwd(), "storage", "uploads"));
  const uploadDir = path.join(uploadRoot, report.id);
  await mkdir(uploadDir, { recursive: true });

  let combinedText = "";
  for (const file of files) {
    assertSupportedFile(file);
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = path.join(uploadDir, `${Date.now()}-${safeName}`);
    await writeFile(storagePath, bytes);
    const text = await extractTextFromFile(file);
    combinedText += `\n\nFile: ${file.name}\n${text}`;
    await prisma.uploadedFile.create({
      data: {
        reportId: report.id,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        textPreview: text.slice(0, 2000)
      }
    });
  }

  const rules = await prisma.vatRule.findMany({ where: { isActive: true } });
  const items = await analyzeTransactions(combinedText, rules);
  return NextResponse.json({ reportId: report.id, items });
}
