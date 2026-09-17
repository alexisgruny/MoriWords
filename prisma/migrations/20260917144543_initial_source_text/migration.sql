-- CreateTable
CREATE TABLE "SourceText" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "origin" TEXT,
    "category" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'ja',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceText_pkey" PRIMARY KEY ("id")
);
