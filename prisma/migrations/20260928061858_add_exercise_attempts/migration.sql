-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "level" TEXT,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseAttempt_source_focus_idx" ON "ExerciseAttempt"("source", "focus");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_createdAt_idx" ON "ExerciseAttempt"("createdAt");
