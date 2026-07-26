/*
  Warnings:

  - The `status` column on the `attendances` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `expiresAt` on the `otps` table. All the data in the column will be lost.
  - Added the required column `expiredAt` to the `otps` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE');

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT';

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "expiresAt",
ADD COLUMN     "expiredAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "AttedanceStatus";
