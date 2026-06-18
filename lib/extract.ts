import * as XLSX from "xlsx";

export async function extractTextFromFile(file: File, existingBuffer?: Buffer) {
  const buffer = existingBuffer ?? Buffer.from(await file.arrayBuffer());
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".csv")) return buffer.toString("utf8");

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text.trim() || `PDF upload: ${file.name}. No selectable text was found. If this is a scanned PDF, OCR is required before AI extraction can read it.`;
  }

  return `Image upload: ${file.name}. OCR is recommended for production. Manual confirmation is available before calculation.`;
}

export function assertSupportedFile(file: File) {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".csv", ".xlsx", ".xls"];
  if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    throw new Error("Unsupported file type. Please upload PDF, JPG, PNG, CSV, or Excel files.");
  }
}
