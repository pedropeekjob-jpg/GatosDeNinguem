-- CreateTable
CREATE TABLE "CareTask" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "CareTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareTask_status_idx" ON "CareTask"("status");
