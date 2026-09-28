import { prisma } from "@/lib/db/prisma";

// Utilitaires des tests d'intégration uniquement : un compte jetable par
// fichier de test, dont les données (decks, textes...) disparaissent en
// cascade à sa suppression. Isole aussi chaque fichier des autres, qui
// tournent en parallèle sur la même base.

export async function createTestUser(label: string) {
  const id = `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `safe-to-delete-${id}@example.com`;

  await prisma.user.create({ data: { id, name: "Test", email } });

  return { id, email };
}

export async function deleteTestUser(id: string) {
  await prisma.user.deleteMany({ where: { id } });
}
