import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  await prisma.pricingPlan.update({
    where: { id },
    data: {
      priceCents: Number(form.get("priceCents") || 0),
      fileLimit: Number(form.get("fileLimit") || 1)
    }
  });
  redirect("/admin");
}
