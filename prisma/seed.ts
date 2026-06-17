import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.pricingPlan.upsert({
    where: { key: "free-preview" },
    update: {},
    create: {
      key: "free-preview",
      name: "Free Preview",
      priceCents: 0,
      fileLimit: 1,
      sortOrder: 0,
      features: [
        "Upload up to 1 file",
        "Basic AI document scan",
        "Document type detected",
        "VAT issue indicator",
        "General category suggestion",
        "Low / Medium / High risk level"
      ]
    }
  });

  const paidPlans = [
    {
      key: "basic-scan",
      name: "Basic Scan",
      priceCents: 1000,
      fileLimit: 5,
      sortOrder: 1,
      features: ["AI VAT estimate", "Basic exemption/recovery notes", "PDF summary report"]
    },
    {
      key: "business-review",
      name: "Business Review",
      priceCents: 2900,
      fileLimit: 25,
      sortOrder: 2,
      features: ["Detailed transaction table", "VAT recovery estimate", "Risk flags", "PDF + Excel report", "Referral to VAT specialist"]
    },
    {
      key: "monthly-business",
      name: "Monthly Business Plan",
      priceCents: 9900,
      fileLimit: 100,
      sortOrder: 3,
      features: ["Up to 100 files per month", "Saved reports", "VAT reminders", "Priority specialist referral"]
    }
  ];

  for (const plan of paidPlans) {
    await prisma.pricingPlan.upsert({ where: { key: plan.key }, update: plan, create: plan });
  }

  const rules = [
    {
      key: "standard-rate",
      title: "Standard VAT rate",
      ruleType: "rate",
      value: { rate: 0.1, label: "10%" }
    },
    {
      key: "zero-rated-examples",
      title: "Zero-rated category examples",
      ruleType: "category_examples",
      value: { examples: ["exports", "international transport", "basic food items", "preventive healthcare", "education services"] }
    },
    {
      key: "exempt-examples",
      title: "Exempt category examples",
      ruleType: "category_examples",
      value: { examples: ["financial services", "residential property rental", "life insurance"] }
    },
    {
      key: "outside-scope-examples",
      title: "Outside-scope examples",
      ruleType: "category_examples",
      value: { examples: ["salary payments", "owner capital transfer", "government fines", "non-business reimbursement"] }
    },
    {
      key: "needs-review-fallback",
      title: "Needs professional review fallback",
      ruleType: "fallback",
      value: { message: "Documents with unclear tax treatment, missing invoice data, or mixed supplies should be reviewed by a Bahrain VAT professional." }
    }
  ];

  for (const rule of rules) {
    await prisma.vatRule.upsert({ where: { key: rule.key }, update: rule, create: rule });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
