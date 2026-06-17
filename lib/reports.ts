import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { disclaimer } from "@/lib/disclaimer";

export type ReportExport = {
  id: string;
  businessName?: string | null;
  createdAt: Date;
  uploadedValue: unknown;
  estimatedVatDue: unknown;
  estimatedRecoverable: unknown;
  possibleExemption: unknown;
  possibleSavingsLow: unknown;
  possibleSavingsHigh: unknown;
  confidenceScore: number;
  riskLevel: string;
  recommendedNextStep?: string | null;
  transactions: Array<{
    supplierName?: string | null;
    description: string;
    amountBeforeVat: unknown;
    vatAmount: unknown;
    totalAmount: unknown;
    currency: string;
    vatTreatment: string;
    confidenceScore: number;
    reasoning: string;
    warning?: string | null;
  }>;
};

export async function createPdfReport(report: ReportExport) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(22).text("Dareeba VAT Estimate Report");
  doc.moveDown(0.5).fontSize(10).fillColor("#555").text(disclaimer);
  doc.moveDown().fillColor("#111").fontSize(12);
  doc.text(`User/business name: ${report.businessName || "Not provided"}`);
  doc.text(`Upload date: ${report.createdAt.toISOString().slice(0, 10)}`);
  doc.text(`Report reference: ${report.id}`);
  doc.moveDown();
  doc.fontSize(16).text("Summary");
  doc.fontSize(11);
  doc.text(`Total uploaded value: ${money(report.uploadedValue)}`);
  doc.text(`Estimated VAT due: ${money(report.estimatedVatDue)}`);
  doc.text(`Possible recoverable VAT: ${money(report.estimatedRecoverable)}`);
  doc.text(`Possible exemptions: ${money(report.possibleExemption)}`);
  doc.text(`Potential savings range: ${money(report.possibleSavingsLow)} - ${money(report.possibleSavingsHigh)}`);
  doc.text(`Risk level: ${report.riskLevel}`);
  doc.text(`Recommended next step: ${report.recommendedNextStep || "Professional review recommended."}`);
  doc.moveDown();
  doc.fontSize(16).text("Transaction Table");
  doc.fontSize(9);

  report.transactions.forEach((item, index) => {
    doc.moveDown(0.4);
    doc.text(`${index + 1}. ${item.description}`);
    doc.text(`Supplier: ${item.supplierName || "Unknown"} | Amount: ${money(item.totalAmount)} ${item.currency} | VAT: ${money(item.vatAmount)} | Treatment: ${item.vatTreatment}`);
    doc.text(`Confidence: ${item.confidenceScore}% | Reason: ${item.reasoning}`);
    if (item.warning) doc.fillColor("#8a5a00").text(`Risk flag: ${item.warning}`).fillColor("#111");
  });

  doc.moveDown();
  doc.fontSize(16).text("Disclaimer");
  doc.fontSize(10).text(disclaimer);
  doc.end();

  await new Promise<void>((resolve) => doc.on("end", resolve));
  return Buffer.concat(chunks);
}

export async function createExcelReport(report: ReportExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dareeba";
  const summary = workbook.addWorksheet("Summary");
  summary.addRows([
    ["Report reference", report.id],
    ["Business name", report.businessName || "Not provided"],
    ["Upload date", report.createdAt.toISOString().slice(0, 10)],
    ["Total uploaded value", Number(report.uploadedValue)],
    ["Estimated VAT due", Number(report.estimatedVatDue)],
    ["Possible recoverable VAT", Number(report.estimatedRecoverable)],
    ["Possible exemption amount", Number(report.possibleExemption)],
    ["Potential savings low", Number(report.possibleSavingsLow)],
    ["Potential savings high", Number(report.possibleSavingsHigh)],
    ["Confidence score", `${report.confidenceScore}%`],
    ["Risk level", report.riskLevel],
    ["Recommended next step", report.recommendedNextStep || "Professional review recommended"],
    ["Disclaimer", disclaimer]
  ]);
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 90;

  const transactions = workbook.addWorksheet("Transactions");
  transactions.columns = [
    { header: "Supplier", key: "supplierName", width: 24 },
    { header: "Description", key: "description", width: 44 },
    { header: "Amount before VAT", key: "amountBeforeVat", width: 18 },
    { header: "VAT amount", key: "vatAmount", width: 14 },
    { header: "Total", key: "totalAmount", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "VAT treatment", key: "vatTreatment", width: 22 },
    { header: "Confidence", key: "confidenceScore", width: 14 },
    { header: "Reasoning", key: "reasoning", width: 50 },
    { header: "Warning", key: "warning", width: 35 }
  ];
  report.transactions.forEach((item) => transactions.addRow(item));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
