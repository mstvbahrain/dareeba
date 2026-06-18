-- Dareeba database setup for Neon SQL Editor.
-- Paste this whole file into Neon > SQL Editor, then click Run.

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('PREVIEW', 'PAID', 'REFERRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VatTreatment" AS ENUM ('STANDARD_RATED', 'ZERO_RATED', 'EXEMPT', 'OUTSIDE_SCOPE', 'NEEDS_REVIEW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'SENT_TO_PARTNER', 'CONTACTED', 'CONVERTED', 'COMMISSION_RECEIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "company" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "planKey" TEXT NOT NULL DEFAULT 'free-preview',
  "status" "ReportStatus" NOT NULL DEFAULT 'PREVIEW',
  "businessName" TEXT,
  "uploadedValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "estimatedVatDue" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "estimatedRecoverable" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "possibleExemption" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "possibleSavingsLow" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "possibleSavingsHigh" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "confidenceScore" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "recommendedNextStep" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UploadedFile" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "textPreview" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadedFile_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "supplierName" TEXT,
  "invoiceDate" TIMESTAMP(3),
  "invoiceNumber" TEXT,
  "description" TEXT NOT NULL,
  "amountBeforeVat" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BHD',
  "category" TEXT,
  "customsReference" TEXT,
  "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "confidenceScore" INTEGER NOT NULL DEFAULT 50,
  "reasoning" TEXT NOT NULL,
  "warning" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PricingPlan" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "fileLimit" INTEGER NOT NULL,
  "features" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "VatRule" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "ruleType" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT,
  "userId" TEXT,
  "planKey" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "providerSessionId" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReferralLead" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "vatIssueType" TEXT NOT NULL,
  "preferredContactMethod" TEXT NOT NULL,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "referralFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "percentageCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "totalExpectedCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralLead_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "PricingPlan" ("id", "key", "name", "priceCents", "currency", "fileLimit", "features", "isActive", "sortOrder", "updatedAt")
VALUES
  ('plan_free_preview', 'free-preview', 'Free Preview', 0, 'USD', 1, '["Upload up to 1 file","Basic AI document scan","Document type detected","VAT issue indicator","General category suggestion","Low / Medium / High risk level"]', true, 0, CURRENT_TIMESTAMP),
  ('plan_basic_scan', 'basic-scan', 'Basic Scan', 1000, 'USD', 5, '["AI VAT estimate","Basic exemption/recovery notes","PDF summary report"]', true, 1, CURRENT_TIMESTAMP),
  ('plan_business_review', 'business-review', 'Business Review', 2900, 'USD', 25, '["Detailed transaction table","VAT recovery estimate","Risk flags","PDF + Excel report","Referral to VAT specialist"]', true, 2, CURRENT_TIMESTAMP),
  ('plan_monthly_business', 'monthly-business', 'Monthly Business Plan', 9900, 'USD', 100, '["Up to 100 files per month","Saved reports","VAT reminders","Priority specialist referral"]', true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "priceCents" = EXCLUDED."priceCents",
  "fileLimit" = EXCLUDED."fileLimit",
  "features" = EXCLUDED."features",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "VatRule" ("id", "key", "title", "ruleType", "value", "isActive", "updatedAt")
VALUES
  ('rule_standard_rate', 'standard-rate', 'Standard VAT rate', 'rate', '{"rate":0.1,"label":"10%"}', true, CURRENT_TIMESTAMP),
  ('rule_zero_rated', 'zero-rated-examples', 'Zero-rated category examples', 'category_examples', '{"examples":["exports","international transport","basic food items","preventive healthcare","education services"]}', true, CURRENT_TIMESTAMP),
  ('rule_exempt', 'exempt-examples', 'Exempt category examples', 'category_examples', '{"examples":["financial services","residential property rental","life insurance"]}', true, CURRENT_TIMESTAMP),
  ('rule_outside_scope', 'outside-scope-examples', 'Outside-scope examples', 'category_examples', '{"examples":["salary payments","owner capital transfer","government fines","non-business reimbursement"]}', true, CURRENT_TIMESTAMP),
  ('rule_needs_review', 'needs-review-fallback', 'Needs professional review fallback', 'fallback', '{"message":"Documents with unclear tax treatment, missing invoice data, or mixed supplies should be reviewed by a Bahrain VAT professional."}', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "title" = EXCLUDED."title",
  "ruleType" = EXCLUDED."ruleType",
  "value" = EXCLUDED."value",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;
