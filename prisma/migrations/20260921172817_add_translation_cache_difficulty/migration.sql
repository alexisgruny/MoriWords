-- AlterTable
ALTER TABLE "TranslationCache" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'N5';

-- CreateIndex
CREATE INDEX "TranslationCache_difficulty_lemma_idx" ON "TranslationCache"("difficulty", "lemma");
