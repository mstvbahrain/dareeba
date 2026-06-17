import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const raw = String(form.get("value") || "{}");
  await prisma.vatRule.update({ where: { id }, data: { value: JSON.parse(raw) } });
  redirect("/admin");
}
