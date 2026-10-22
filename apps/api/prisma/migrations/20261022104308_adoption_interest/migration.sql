-- CreateTable
CREATE TABLE "AdoptionInterest" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "catSlug" TEXT,
    "data" JSONB NOT NULL,

    CONSTRAINT "AdoptionInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdoptionInterest_catSlug_idx" ON "AdoptionInterest"("catSlug");
