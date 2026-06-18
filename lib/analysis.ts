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

export function classifyConfirmedTransactions(items: Array<ExtractedTransaction & Partial<AnalyzedTransaction>>): AnalyzedTransaction[] {
  return items.map((item) => {
    if (item.vatTreatment && item.reasoning) {
      return normalizeItem({
        ...item,
        vatTreatment: item.vatTreatment,
        confidenceScore: item.confidenceScore ?? 70,
        reasoning: item.reasoning,
        warning: item.warning
      });
    }

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
    const ai = await analyzeWithOpenAI(text, rules).catch((error) => {
      console.error("OpenAI VAT extraction failed", error);
      return null;
    });
    if (ai?.length) return ai;
  }

  return fallbackAnalyze(text);
}

async function analyzeWithOpenAI(text: string, rules: VatRule[]): Promise<AnalyzedTransaction[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bahrain_vat_document_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["items"],
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "supplierName",
                  "invoiceDate",
                  "invoiceNumber",
                  "description",
                  "amountBeforeVat",
                  "vatAmount",
                  "totalAmount",
                  "currency",
                  "category",
                  "customsReference",
                  "vatTreatment",
                  "confidenceScore",
                  "reasoning",
                  "warning"
                ],
                properties: {
                  supplierName: { type: ["string", "null"] },
                  invoiceDate: { type: ["string", "null"], description: "Invoice date as YYYY-MM-DD when available." },
                  invoiceNumber: { type: ["string", "null"] },
                  description: { type: "string" },
                  amountBeforeVat: { type: "number", description: "Subtotal or amount before VAT." },
                  vatAmount: { type: "number" },
                  totalAmount: { type: "number" },
                  currency: { type: "string", description: "Use BHD unless the document clearly shows another currency." },
                  category: { type: ["string", "null"] },
                  customsReference: { type: ["string", "null"] },
                  vatTreatment: {
                    type: "string",
                    enum: ["STANDARD_RATED", "ZERO_RATED", "EXEMPT", "OUTSIDE_SCOPE", "NEEDS_REVIEW"]
                  },
                  confidenceScore: { type: "integer", minimum: 0, maximum: 100 },
                  reasoning: { type: "string", description: "Simple language explanation. Do not provide final tax advice." },
                  warning: { type: ["string", "null"] }
                }
              }
            }
          }
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You extract structured invoice and import-document data for a Bahrain VAT estimate. Identify supplier, invoice number, invoice date, subtotal, VAT amount, total amount, and a preliminary VAT classification. Use cautious language such as estimate, may qualify, possible recovery, and professional review recommended. This is not final tax advice. Mark unclear or incomplete items as NEEDS_REVIEW."
      },
      {
        role: "user",
        content: JSON.stringify({
          rules,
          text: text.slice(0, 16000),
          instruction:
            "Return one item per invoice or clear transaction. If there is one invoice summary, return one item. amountBeforeVat must be the subtotal before VAT. vatAmount must be the VAT charged. totalAmount must be the invoice total."
        })
      }
    ]
  }, { timeout: 15000 });

  const parsed = JSON.parse(response.choices[0]?.message.content ?? "{}") as { items?: AnalyzedTransaction[] };
  return (parsed.items ?? []).map(normalizeItem);
}

function fallbackAnalyze(text: string): AnalyzedTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const source = lines.join(" ").slice(0, 500);
  const invoiceNumber = matchLabel(source, /(?:invoice|inv)\s*(?:no|number|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i);
  const invoiceDate = normalizeDate(matchLabel(source, /(?:invoice\s*)?date\s*[:\-]?\s*([0-9]{1,4}[./\-][0-9]{1,2}[./\-][0-9]{1,4})/i));
  const explicitVat = matchMoney(source, /(?:vat|tax)\s*(?:amount)?\s*[:\-]?\s*(?:BHD|BD|USD)?\s*([0-9,]+(?:\.\d{1,3})?)/i);
  const explicitSubtotal = matchMoney(source, /(?:subtotal|sub total|amount before vat|net amount|taxable amount)\s*[:\-]?\s*(?:BHD|BD|USD)?\s*([0-9,]+(?:\.\d{1,3})?)/i);
  const explicitTotal = matchMoney(source, /(?:grand total|total amount|invoice total|total)\s*[:\-]?\s*(?:BHD|BD|USD)?\s*([0-9,]+(?:\.\d{1,3})?)/i);
  const amountMatches = [...source.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?\b/g)].map((match) => Number(match[0].replace(/,/g, "")));
  const total = explicitTotal ?? amountMatches.at(-1) ?? 0;
  const possibleVat = explicitVat ?? amountMatches.find((amount) => amount > 0 && Math.abs(amount - total * 0.1) < Math.max(1, total * 0.02)) ?? total * 0.1;
  const amountBeforeVat = explicitSubtotal ?? (total > possibleVat ? total - possibleVat : total);
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
      invoiceDate,
      invoiceNumber,
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

function matchLabel(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1]?.trim();
}

function matchMoney(source: string, pattern: RegExp) {
  const value = source.match(pattern)?.[1];
  return value ? Number(value.replace(/,/g, "")) : undefined;
}

function normalizeDate(value?: string) {
  if (!value) return undefined;
  const parts = value.split(/[./-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return value;
  const [a, b, c] = parts;
  const year = a > 1900 ? a : c > 1900 ? c : 2000 + c;
  const month = a > 1900 ? b : b;
  const day = a > 1900 ? c : a;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function normalizeItem(item: AnalyzedTransaction): AnalyzedTransaction {
  const total = Number(item.totalAmount || 0);
  const vat = Number(item.vatAmount || 0);
  const net = Number(item.amountBeforeVat || Math.max(total - vat, 0));
  return {
    supplierName: item.supplierName ?? undefined,
    invoiceDate: item.invoiceDate ?? undefined,
    invoiceNumber: item.invoiceNumber ?? undefined,
    description: item.description || "Uploaded document",
    amountBeforeVat: round(net),
    vatAmount: round(vat),
    totalAmount: round(total || net + vat),
    currency: item.currency || "BHD",
    category: item.category ?? undefined,
    customsReference: item.customsReference ?? undefined,
    vatTreatment: item.vatTreatment || "NEEDS_REVIEW",
    confidenceScore: Math.max(0, Math.min(100, Number(item.confidenceScore || 50))),
    reasoning: item.reasoning || "This item was classified using the configured VAT rules.",
    warning: item.warning ?? undefined
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
