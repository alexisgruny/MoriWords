-- CreateTable
CREATE TABLE "LemmaExampleCache" (
    "id" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'ja',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "examples" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LemmaExampleCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LemmaExampleCache_lemma_sourceLanguage_targetLanguage_key" ON "LemmaExampleCache"("lemma", "sourceLanguage", "targetLanguage");
