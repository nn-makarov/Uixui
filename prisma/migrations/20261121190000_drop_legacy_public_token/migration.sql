-- Phase C: hashes are authoritative and have been verified for every existing order.
ALTER TABLE "Order" ALTER COLUMN "publicTokenHash" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "publicTokenIssuedAt" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "publicTokenExpiresAt" SET NOT NULL;

DROP INDEX IF EXISTS "Order_publicToken_key";
ALTER TABLE "Order" DROP COLUMN "publicToken";
