-- CreateTable
CREATE TABLE "VocabularyEntry" (
    "id" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "surface" TEXT,
    "reading" TEXT,
    "partOfSpeech" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'ja',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyEntry_sourceLanguage_targetLanguage_occurrenceCou_idx" ON "VocabularyEntry"("sourceLanguage", "targetLanguage", "occurrenceCount");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyEntry_lemma_sourceLanguage_targetLanguage_key" ON "VocabularyEntry"("lemma", "sourceLanguage", "targetLanguage");
