import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db/prisma";

// Comptes utilisateurs : email + mot de passe (haché par la librairie) et
// Google. Variables d'environnement :
// - BETTER_AUTH_SECRET (obligatoire en production) : signe les sessions.
// - BETTER_AUTH_URL : adresse publique du site (ex. https://moriwords.vercel.app).
// - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET : bouton Google, masqué sans elles.
// - OWNER_EMAIL : le compte créé avec cet email récupère les données d'avant
//   les comptes (decks, textes, tentatives d'exercice sans propriétaire).

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);

// Donne au propriétaire du site tout ce qui a été créé avant les comptes.
async function claimLegacyData(userId: string) {
  const [decks, sourceTexts, attempts] = await prisma.$transaction([
    prisma.deck.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.sourceText.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.exerciseAttempt.updateMany({ where: { userId: null }, data: { userId } }),
  ]);

  console.info(
    `Données existantes rattachées au propriétaire : ${decks.count} deck(s), ${sourceTexts.count} texte(s), ${attempts.count} tentative(s).`,
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {},
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

          if (ownerEmail && user.email.toLowerCase() === ownerEmail) {
            await claimLegacyData(user.id);
          }
        },
      },
    },
  },
  // Pose le cookie de session aussi depuis les Server Actions (Next.js).
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
