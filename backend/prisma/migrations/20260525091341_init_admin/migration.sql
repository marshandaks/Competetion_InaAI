-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentiment" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "topics" TEXT[],
    "summary" TEXT,
    "importBatchId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_sentiment_idx" ON "Feedback"("sentiment");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
