-- CreateTable
CREATE TABLE "NewsletterSignup" (
    "email" TEXT NOT NULL,
    "interests" TEXT[],
    "subscribedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSignup_pkey" PRIMARY KEY ("email")
);
