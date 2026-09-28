-- CreateTable
CREATE TABLE "ExerciseCorrectionCache" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "answerKey" TEXT NOT NULL,
    "correction" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseCorrectionCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseCorrectionCache_exerciseId_answerKey_key" ON "ExerciseCorrectionCache"("exerciseId", "answerKey");
