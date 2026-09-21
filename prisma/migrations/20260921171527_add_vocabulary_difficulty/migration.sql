-- AlterTable
ALTER TABLE "VocabularyEntry" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'N5';

-- CreateIndex
CREATE INDEX "VocabularyEntry_difficulty_occurrenceCount_idx" ON "VocabularyEntry"("difficulty", "occurrenceCount");
