-- DropIndex
DROP INDEX "VocabularyEntry_lemma_sourceLanguage_targetLanguage_key";

-- AlterTable
ALTER TABLE "VocabularyEntry" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyEntry_userId_lemma_sourceLanguage_targetLanguage_key" ON "VocabularyEntry"("userId", "lemma", "sourceLanguage", "targetLanguage");

-- AddForeignKey
ALTER TABLE "VocabularyEntry" ADD CONSTRAINT "VocabularyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

