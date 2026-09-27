-- CreateTable
CREATE TABLE "CardExample" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "reading" TEXT,
    "translation" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExercise" (
    "id" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "french" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardExample_cardId_idx" ON "CardExample"("cardId");

-- CreateIndex
CREATE INDEX "GrammarExercise_pointId_idx" ON "GrammarExercise"("pointId");

-- AddForeignKey
ALTER TABLE "CardExample" ADD CONSTRAINT "CardExample_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
