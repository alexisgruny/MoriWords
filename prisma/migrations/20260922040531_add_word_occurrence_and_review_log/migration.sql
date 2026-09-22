-- CreateTable
CREATE TABLE "WordOccurrence" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "sourceTextId" TEXT,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "interval" INTEGER NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordOccurrence_cardId_idx" ON "WordOccurrence"("cardId");

-- CreateIndex
CREATE INDEX "WordOccurrence_sourceTextId_idx" ON "WordOccurrence"("sourceTextId");

-- CreateIndex
CREATE UNIQUE INDEX "WordOccurrence_cardId_sourceTextId_key" ON "WordOccurrence"("cardId", "sourceTextId");

-- CreateIndex
CREATE INDEX "ReviewLog_cardId_reviewedAt_idx" ON "ReviewLog"("cardId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "WordOccurrence" ADD CONSTRAINT "WordOccurrence_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordOccurrence" ADD CONSTRAINT "WordOccurrence_sourceTextId_fkey" FOREIGN KEY ("sourceTextId") REFERENCES "SourceText"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
