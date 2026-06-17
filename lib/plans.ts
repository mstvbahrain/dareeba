export const pricingPlans = [
  {
    key: "free-preview",
    name: "Free Preview",
    price: "$0",
    fileLimit: 1,
    summary: "A limited first look at whether a VAT issue may exist.",
    features: [
      "Upload up to 1 file",
      "Basic AI document scan",
      "Document type detected",
      "VAT issue indicator",
      "General category suggestion",
      "Risk level: Low / Medium / High"
    ],
    hidden: ["Exact VAT calculations", "Recoverable VAT estimate", "Exemption details", "PDF/Excel report"],
    cta: "Unlock full VAT estimate and recommendations from $10"
  },
  {
    key: "basic-scan",
    name: "Basic Scan",
    price: "$10",
    fileLimit: 5,
    summary: "A practical estimate for a small set of invoices or receipts.",
    features: ["Upload up to 5 files", "AI VAT estimate", "Basic exemption/recovery notes", "PDF summary report"]
  },
  {
    key: "business-review",
    name: "Business Review",
    price: "$29",
    fileLimit: 25,
    summary: "More detail for company purchases, imports, and recovery checks.",
    features: ["Upload up to 25 files", "Detailed transaction table", "VAT recovery estimate", "Risk flags", "PDF + Excel report", "Referral to VAT specialist"]
  },
  {
    key: "monthly-business",
    name: "Monthly Business Plan",
    price: "$99/month",
    fileLimit: 100,
    summary: "Ongoing VAT checks for growing Bahrain businesses.",
    features: ["Up to 100 files per month", "Saved reports", "VAT reminders", "Priority specialist referral"]
  }
];
