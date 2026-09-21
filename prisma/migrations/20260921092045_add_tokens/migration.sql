-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "sourceTextId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "lemma" TEXT,
    "reading" TEXT,
    "partOfSpeech" TEXT,
    "position" INTEGER NOT NULL,
    "isParticle" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Token_sourceTextId_position_idx" ON "Token"("sourceTextId", "position");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_sourceTextId_fkey" FOREIGN KEY ("sourceTextId") REFERENCES "SourceText"("id") ON DELETE CASCADE ON UPDATE CASCADE;
