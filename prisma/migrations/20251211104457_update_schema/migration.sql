-- Step 1: Create ProductType enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "ProductType" AS ENUM ('SIMPLE', 'VARIANTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns that will be populated
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "basePrice" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "productType" "ProductType";

-- Step 3: Migrate data: Copy price to basePrice
UPDATE "products" SET "basePrice" = "price" WHERE "price" IS NOT NULL;

-- Step 4: Set default values for null basePrice
UPDATE "products" SET "basePrice" = 0 WHERE "basePrice" IS NULL;
UPDATE "products" SET "productType" = 'SIMPLE' WHERE "productType" IS NULL;

-- Step 5: Make basePrice and productType NOT NULL
ALTER TABLE "products" ALTER COLUMN "basePrice" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "basePrice" SET DEFAULT 0;
ALTER TABLE "products" ALTER COLUMN "productType" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "productType" SET DEFAULT 'SIMPLE';

-- Step 6: Drop old price column
ALTER TABLE "products" DROP COLUMN "price";

-- Step 7: Add variantId columns to cart_items, order_items, stock_logs
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "stock_logs" ADD COLUMN IF NOT EXISTS "variantId" TEXT;

-- Step 8: Add new columns to product_variants
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "sku" TEXT;

-- Step 9: Handle duplicate SKUs - set them to NULL before adding unique constraint
-- First, find and nullify duplicate SKUs (keep the first one)
UPDATE "product_variants" pv1
SET "sku" = NULL
WHERE "sku" IS NOT NULL
AND EXISTS (
  SELECT 1 FROM "product_variants" pv2
  WHERE pv2."sku" = pv1."sku"
  AND pv2."id" < pv1."id"
);

-- Step 10: Create unique constraint on sku (NULL values are allowed, duplicates are not)
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku") WHERE "sku" IS NOT NULL;

-- Step 11: Add foreign key constraints
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_fkey" 
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_variantId_fkey" 
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" 
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

