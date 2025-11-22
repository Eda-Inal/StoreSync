/*
  Warnings:

  - You are about to drop the column `email` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `vendors` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "vendors_email_key";

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "email",
DROP COLUMN "password",
DROP COLUMN "role";
