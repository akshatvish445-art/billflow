-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankIfsc" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "planPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "planStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateCode" TEXT,
ADD COLUMN     "upiId" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateCode" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "isGstInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "sgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceLineItem" ADD COLUMN     "gstRate" DECIMAL(65,30) DEFAULT 18,
ADD COLUMN     "hsnSac" TEXT;
