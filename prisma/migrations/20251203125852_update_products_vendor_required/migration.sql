-- AlterTable: Make vendorId required in products table
-- First, ensure all products have a vendorId (handle NULL values if any)
-- Then make the column NOT NULL

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_vendorId_fkey";

-- AlterTable: Make vendorId NOT NULL
ALTER TABLE "products" ALTER COLUMN "vendorId" SET NOT NULL;

-- AddForeignKey: Re-add foreign key constraint with RESTRICT onDelete
ALTER TABLE "products" ADD CONSTRAINT "products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

