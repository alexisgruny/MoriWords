-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'ja',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "translation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationCache_sourceLanguage_targetLanguage_lemma_idx" ON "TranslationCache"("sourceLanguage", "targetLanguage", "lemma");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationCache_lemma_sourceLanguage_targetLanguage_key" ON "TranslationCache"("lemma", "sourceLanguage", "targetLanguage");

-- CreateIndex
CREATE INDEX "Card_deckId_dueAt_idx" ON "Card"("deckId", "dueAt");
