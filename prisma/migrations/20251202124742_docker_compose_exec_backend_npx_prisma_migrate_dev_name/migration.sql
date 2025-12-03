-- AlterTable: Add deletedAt and isActive to Vendor table
ALTER TABLE "Vendor" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Vendor" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add deletedAt to Product table and make vendorId nullable
ALTER TABLE "products" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- DropForeignKey: Remove old foreign key constraints
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_vendorId_fkey";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_vendorId_fkey";
ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_userId_fkey";

-- AlterTable: Make vendorId nullable in products
ALTER TABLE "products" ALTER COLUMN "vendorId" DROP NOT NULL;

-- AddForeignKey: Re-add foreign key constraints with correct onDelete behavior
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

