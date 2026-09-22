-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "audioCacheId" TEXT,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "AudioCache" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "audioData" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageCache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "attribution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioCache_text_language_voice_key" ON "AudioCache"("text", "language", "voice");

-- CreateIndex
CREATE UNIQUE INDEX "ImageCache_query_key" ON "ImageCache"("query");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_audioCacheId_fkey" FOREIGN KEY ("audioCacheId") REFERENCES "AudioCache"("id") ON DELETE SET NULL ON UPDATE CASCADE;
