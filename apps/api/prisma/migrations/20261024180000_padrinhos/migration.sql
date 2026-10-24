-- CreateTable
CREATE TABLE "SponsorLetter" (
    "id" TEXT NOT NULL,
    "catSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "SponsorLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorLetter_catSlug_idx" ON "SponsorLetter"("catSlug");
