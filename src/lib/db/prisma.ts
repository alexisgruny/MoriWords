import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Lit l'adresse de connexion à la base PostgreSQL depuis les variables d'environnement.
const connectionString = process.env.DATABASE_URL;

// Arrête l'application immédiatement si la base n'est pas configurée.
if (!connectionString) {
  throw new Error("DATABASE_URL est manquant.");
}

// Crée l'adaptateur qui permet à Prisma de parler à PostgreSQL.
const adapter = new PrismaPg({
  connectionString,
});

// Stocke le client Prisma sur l'objet global pour éviter d'en recréer un
// nouveau à chaque rechargement à chaud pendant le développement.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Réutilise le client existant s'il y en a déjà un, sinon en crée un nouveau.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// Garde une référence globale seulement en dehors de la production.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
