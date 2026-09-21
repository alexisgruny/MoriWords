-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "surface" TEXT,
    "reading" TEXT,
    "meaning" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'ja',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_deckId_lemma_idx" ON "Card"("deckId", "lemma");

-- CreateIndex
CREATE UNIQUE INDEX "Card_deckId_lemma_sourceLanguage_targetLanguage_key" ON "Card"("deckId", "lemma", "sourceLanguage", "targetLanguage");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
