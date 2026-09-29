-- DropIndex
DROP INDEX "GrammarExercise_pointId_idx";

-- AlterTable
ALTER TABLE "GrammarExercise" ADD COLUMN     "generation" INTEGER NOT NULL DEFAULT 2;

-- Les phrases déjà générées viennent de l'ancienne consigne (trop dures en N5).
UPDATE "GrammarExercise" SET "generation" = 1;

-- CreateIndex
CREATE INDEX "GrammarExercise_pointId_generation_idx" ON "GrammarExercise"("pointId", "generation");

