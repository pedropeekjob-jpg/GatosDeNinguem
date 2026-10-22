-- CreateTable
CREATE TABLE "CatCare" (
    "catId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatCare_pkey" PRIMARY KEY ("catId")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDose" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "MedicationDose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetAppointment" (
    "id" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "VetAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitNote" (
    "id" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "VisitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareAlert" (
    "id" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "CareAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medication_catId_idx" ON "Medication"("catId");

-- CreateIndex
CREATE INDEX "MedicationDose_date_idx" ON "MedicationDose"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationDose_medicationId_date_time_key" ON "MedicationDose"("medicationId", "date", "time");

-- CreateIndex
CREATE INDEX "VetAppointment_catId_idx" ON "VetAppointment"("catId");

-- CreateIndex
CREATE INDEX "VetAppointment_startsAt_idx" ON "VetAppointment"("startsAt");

-- CreateIndex
CREATE INDEX "VisitNote_catId_idx" ON "VisitNote"("catId");

-- CreateIndex
CREATE INDEX "CareAlert_createdAt_idx" ON "CareAlert"("createdAt");

-- CreateIndex
CREATE INDEX "CareAlert_catId_idx" ON "CareAlert"("catId");
