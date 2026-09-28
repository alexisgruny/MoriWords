-- CreateTable
CREATE TABLE "ClaudeUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaudeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClaudeUsage_userId_createdAt_idx" ON "ClaudeUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ClaudeUsage_createdAt_idx" ON "ClaudeUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "ClaudeUsage" ADD CONSTRAINT "ClaudeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

