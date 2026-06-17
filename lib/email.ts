import nodemailer from "nodemailer";

export async function notifyPartnerLead(payload: {
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  vatIssueType: string;
  reportId: string;
  preferredContactMethod: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.PARTNER_EMAIL) {
    return { sent: false, reason: "SMTP or partner email not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.PARTNER_EMAIL,
    subject: `New Dareeba VAT referral: ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Company: ${payload.companyName || "Not provided"}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone}`,
      `VAT issue: ${payload.vatIssueType}`,
      `Report reference: ${payload.reportId}`,
      `Preferred contact: ${payload.preferredContactMethod}`
    ].join("\n")
  });

  return { sent: true };
}
