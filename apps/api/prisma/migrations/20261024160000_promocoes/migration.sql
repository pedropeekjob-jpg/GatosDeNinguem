-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "eventStartsAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_postId_key" ON "Promotion"("postId");

-- CreateIndex
CREATE INDEX "Promotion_status_scheduledFor_idx" ON "Promotion"("status", "scheduledFor");
