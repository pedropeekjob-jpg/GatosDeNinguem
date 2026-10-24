-- CreateTable
CREATE TABLE "CatAlertSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "endpoint" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "CatAlertSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatAlertSent" (
    "catId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "CatAlertSent_pkey" PRIMARY KEY ("catId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatAlertSubscriber_email_key" ON "CatAlertSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CatAlertSubscriber_endpoint_key" ON "CatAlertSubscriber"("endpoint");
