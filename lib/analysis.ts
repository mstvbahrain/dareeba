import OpenAI from "openai";
import type { VatRule } from "@prisma/client";

export type ExtractedTransaction = {
  supplierName?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  description: string;
  amountBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  category?: string;
  customsReference?: string;
};

export type AnalyzedTransaction = ExtractedTransaction & {
  vatTreatment: "STANDARD_RATED" | "ZERO_RATED" | "EXEMPT" | "OUTSIDE_SCOPE" | "NEEDS_REVIEW";
  confidenceScore: number;
  reasoning: string;
  warning?: string;
};

const reviewWords = ["mixed", "customs", "import", "insurance", "finance", "property", "unclear", "consulting"];

export function classifyConfirmedTransactions(items: ExtractedTransaction[]): AnalyzedTransaction[] {
  return items.map((item) => {
    const source = `${item.description} ${item.category ?? ""} ${item.customsReference ?? ""}`.toLowerCase();
    const needsReview = reviewWords.some((word) => source.includes(word)) || !item.description || item.totalAmount <= 0;
    const zeroRated = ["export", "international transport", "basic food", "education", "healthcare"].some((word) => source.includes(word));
    const exempt = ["financial", "residential", "life insurance"].some((word) => source.includes(word));
    const outside = ["salary", "fine", "capital transfer", "owner transfer"].some((word) => source.includes(word));
    let vatTreatment: AnalyzedTransaction["vatTreatment"] = "STANDARD_RATED";
    if (needsReview) vatTreatment = "NEEDS_REVIEW";
    else if (zeroRated) vatTreatment = "ZERO_RATED";
    else if (exempt) vatTreatment = "EXEMPT";
    else if (outside) vatTreatment = "OUTSIDE_SCOPE";

    return normalizeItem({
      ...item,
      vatTreatment,
      confidenceScore: needsReview ? 55 : item.vatAmount > 0 ? 82 : 70,
      reasoning:
        vatTreatment === "STANDARD_RATED"
          ? "The confirmed item appears to include a standard Bahrain VAT charge based on the provided amount and category."
          : vatTreatment === "NEEDS_REVIEW"
            ? "The confirmed item includes details that may require professional review before VAT treatment is finalized."
            : "The confirmed item matches one of the configured category examples for this VAT treatment.",
      warning: needsReview ? "Professional review recommended because the item may be unclear, imported, mixed, or missing data." : undefined
    });
  });
}

export async function analyzeTransactions(text: string, rules: VatRule[]): Promise<AnalyzedTransaction[]> {
  if (process.env.OPENAI_API_KEY) {
    const ai = await analyzeWithOpenAI(text, rules).catch(() => null);
    if (ai?.length) return ai;
  }

  return fallbackAnalyze(text);
}

async function analyzeWithOpenAI(text: string, rules: VatRule[]): Promise<AnalyzedTransaction[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract invoice/import rows for a Bahrain VAT estimate. Return JSON with an items array. Use cautious language and mark unclear items NEEDS_REVIEW. This is not final tax advice."
      },
      {
        role: "user",
        content: JSON.stringify({
          rules,
          text: text.slice(0, 16000),
          schema: {
            items: [
              {
                supplierName: "string optional",
                invoiceDate: "YYYY-MM-DD optional",
                invoiceNumber: "string optional",
                description: "string",
                amountBeforeVat: "number",
                vatAmount: "number",
                totalAmount: "number",
                currency: "BHD",
                category: "string optional",
                customsReference: "string optional",
                vatTreatment: "STANDARD_RATED | ZERO_RATED | EXEMPT | OUTSIDE_SCOPE | NEEDS_REVIEW",
                confidenceScore: "0-100",
                reasoning: "simple language",
                warning: "string optional"
              }
            ]
          }
        })
      }
    ]
  });

  const parsed = JSON.parse(response.choices[0]?.message.content ?? "{}") as { items?: AnalyzedTransaction[] };
  return (parsed.items ?? []).map(normalizeItem);
}

function fallbackAnalyze(text: string): AnalyzedTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const source = lines.join(" ").slice(0, 500);
  const amountMatches = [...source.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?\b/g)].map((match) => Number(match[0].replace(/,/g, "")));
  const total = amountMatches.at(-1) ?? 0;
  const possibleVat = amountMatches.find((amount) => amount > 0 && Math.abs(amount - total * 0.1) < Math.max(1, total * 0.02)) ?? total * 0.1;
  const amountBeforeVat = total > possibleVat ? total - possibleVat : total;
  const lower = source.toLowerCase();
  const needsReview = reviewWords.some((word) => lower.includes(word));
  const zeroRated = ["export", "international transport", "basic food", "education", "healthcare"].some((word) => lower.includes(word));
  const exempt = ["financial", "residential", "life insurance"].some((word) => lower.includes(word));
  const outside = ["salary", "fine", "capital transfer"].some((word) => lower.includes(word));

  let vatTreatment: AnalyzedTransaction["vatTreatment"] = "STANDARD_RATED";
  if (needsReview) vatTreatment = "NEEDS_REVIEW";
  else if (zeroRated) vatTreatment = "ZERO_RATED";
  else if (exempt) vatTreatment = "EXEMPT";
  else if (outside) vatTreatment = "OUTSIDE_SCOPE";

  return [
    normalizeItem({
      supplierName: lines[0]?.slice(0, 80),
      description: source || "Uploaded document",
      amountBeforeVat,
      vatAmount: vatTreatment === "STANDARD_RATED" ? possibleVat : 0,
      totalAmount: total || amountBeforeVat + possibleVat,
      currency: source.includes("USD") ? "USD" : "BHD",
      category: vatTreatment.toLowerCase().replace("_", " "),
      vatTreatment,
      confidenceScore: source ? 62 : 35,
      reasoning:
        vatTreatment === "NEEDS_REVIEW"
          ? "The document includes terms that may need professional Bahrain VAT review."
          : "The estimate uses the configured Bahrain VAT rule examples and detected amounts.",
      warning: source ? undefined : "The document text was unclear or missing."
    })
  ];
}

function normalizeItem(item: AnalyzedTransaction): AnalyzedTransaction {
  const total = Number(item.totalAmount || 0);
  const vat = Number(item.vatAmount || 0);
  const net = Number(item.amountBeforeVat || Math.max(total - vat, 0));
  return {
    supplierName: item.supplierName,
    invoiceDate: item.invoiceDate,
    invoiceNumber: item.invoiceNumber,
    description: item.description || "Uploaded document",
    amountBeforeVat: round(net),
    vatAmount: round(vat),
    totalAmount: round(total || net + vat),
    currency: item.currency || "BHD",
    category: item.category,
    customsReference: item.customsReference,
    vatTreatment: item.vatTreatment || "NEEDS_REVIEW",
    confidenceScore: Math.max(0, Math.min(100, Number(item.confidenceScore || 50))),
    reasoning: item.reasoning || "This item was classified using the configured VAT rules.",
    warning: item.warning
  };
}

export function summarize(items: AnalyzedTransaction[]) {
  const uploadedValue = sum(items.map((item) => item.totalAmount));
  const estimatedVatDue = sum(items.filter((item) => item.vatTreatment === "STANDARD_RATED").map((item) => item.amountBeforeVat * 0.1));
  const estimatedRecoverable = sum(items.filter((item) => ["STANDARD_RATED", "NEEDS_REVIEW"].includes(item.vatTreatment)).map((item) => item.vatAmount));
  const possibleExemption = sum(items.filter((item) => ["ZERO_RATED", "EXEMPT"].includes(item.vatTreatment)).map((item) => item.totalAmount));
  const unclearCount = items.filter((item) => item.vatTreatment === "NEEDS_REVIEW" || item.warning).length;
  const confidenceScore = Math.round(sum(items.map((item) => item.confidenceScore)) / Math.max(items.length, 1));
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" = unclearCount > 1 || confidenceScore < 50 ? "HIGH" : unclearCount === 1 || confidenceScore < 75 ? "MEDIUM" : "LOW";
  const possibleSavingsLow = round(estimatedRecoverable * 0.5);
  const possibleSavingsHigh = round(estimatedRecoverable + possibleExemption * 0.1);

  return {
    uploadedValue: round(uploadedValue),
    estimatedVatDue: round(estimatedVatDue),
    estimatedRecoverable: round(estimatedRecoverable),
    possibleExemption: round(possibleExemption),
    possibleSavingsLow,
    possibleSavingsHigh,
    confidenceScore,
    riskLevel,
    recommendedNextStep:
      riskLevel === "LOW"
        ? "Download the report and keep supporting documents for professional confirmation."
        : "Professional review recommended before relying on the VAT treatment."
  };
}

function sum(values: number[]) {
  return round(values.reduce((total, value) => total + Number(value || 0), 0));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
