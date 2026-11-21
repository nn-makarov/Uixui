-- Phase A: keep the legacy token column while introducing hashed public tokens.
ALTER TABLE "Order" ALTER COLUMN "publicToken" DROP NOT NULL;

ALTER TABLE "Order"
ADD COLUMN "publicTokenHash" TEXT,
ADD COLUMN "publicTokenNonce" TEXT,
ADD COLUMN "publicTokenIssuedAt" TIMESTAMP(3),
ADD COLUMN "publicTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_publicTokenHash_key" ON "Order"("publicTokenHash");
CREATE INDEX "Order_publicTokenExpiresAt_idx" ON "Order"("publicTokenExpiresAt");
