-- CreateTable
CREATE TABLE "FosterApplication" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "FosterApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FosterApplication_status_idx" ON "FosterApplication"("status");
