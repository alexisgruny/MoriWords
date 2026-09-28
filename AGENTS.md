<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Consignes MoriWords

Application d'apprentissage du japonais pour francophones : texte japonais → tokenization (kuromoji) → traduction Claude → decks de révision SM-2 → exercices corrigés. Next.js 16 (App Router), TypeScript strict, Prisma 7 + PostgreSQL, Tailwind 4, Vitest. Déployée sur Vercel.

## Économiser les tokens (important : forfait limité)

- La règle Next.js ci-dessus ne s'applique qu'aux API propres à Next (routing, `params`, cache, config, métadonnées…). Pour du TypeScript, Prisma, React ou Tailwind classique, ne lis pas `node_modules/next/dist/docs/`. Et quand c'est nécessaire, lis uniquement le guide concerné, jamais tout le dossier.
- Ne lis pas `package-lock.json`, `scripts/data/`, `node_modules/` ni les gros jeux de données JLPT, sauf demande explicite.
- Va droit aux fichiers utiles (voir la carte ci-dessous) au lieu d'explorer tout le projet.
- Réponses courtes : pas de résumé de ce que tu viens de faire au-delà de quelques lignes.
- Ne relance les tests et le lint qu'une fois, à la fin, sauf s'ils échouent.

## Carte du code

- `src/app/` : pages (`/`, `/decks`, `/vocabulaire`, `/exercices`, `/grammaire`, `/kanji`, `/conjugaison`, `/historique`) et routes API (`src/app/api/`)
- `src/lib/feeds/claude-json-generator.ts` : point d'entrée commun des appels Claude qui renvoient du JSON
- `src/lib/translation/translate.ts` : traduction avec cache (`TranslationCache`)
- `src/lib/decks/card-examples.ts` : phrases d'exemple avec cache par mot (`LemmaExampleCache`)
- `src/lib/grammar/exercises.ts` : exercices et corrections (`ExerciseCorrectionCache`)
- `src/lib/srs/` : SM-2 et série de jours · `src/lib/tokenizer/` : tokenization par langue
- `src/types/shared.ts` : types partagés client/serveur · `prisma/schema.prisma` : schéma
- `PLAN-MVP.txt` : historique et priorités · `docs/FEUILLE-DE-ROUTE-LANCEMENT.txt` : plan de lancement

## Appels à Claude (coûtent de l'argent)

- Modèle : `claude-haiku-4-5-20251001`. N'en change pas sans demande explicite.
- Passe par `generateJsonFromClaude` (réponse validée par un schéma Zod) plutôt que d'instancier un nouveau client.
- Avant tout nouvel appel, vérifie si un cache existant peut servir, ou crée-en un. Le but du projet est de réutiliser au maximum ce qui a déjà été généré.
- Limite la taille des entrées envoyées à Claude et garde des `maxTokens` serrés.
- Les tests ne doivent jamais faire de vrai appel à l'API. `vitest.config.ts` n'expose que `DATABASE_URL`, garde les autres clés absentes.

## Sécurité

- Jamais de secret dans le code : tout passe par les variables d'environnement (`.env*` est ignoré par Git).
- Valide chaque corps de requête (Zod ou garde de type) et limite la longueur des textes.
- Pas de `$queryRawUnsafe`. Les erreurs renvoyées au client restent génériques, sans détails internes.
- Quand il y aura des comptes utilisateurs : dans chaque route, vérifier que la ressource appartient bien à l'utilisateur connecté.

## Conventions

- Interface, messages d'erreur et commentaires en français. Commentaires courts qui expliquent le « pourquoi ».
- Imports via l'alias `@/`. Pas de `any`.
- Tests colocalisés : `*.test.ts` (unitaires) et `*.integration.test.ts` (vraie base Postgres).
- Nouvelle table ou colonne : modifier `prisma/schema.prisma` et créer une migration (`npm run db:migrate`). Ne jamais modifier une migration existante.
- Messages de commit en français, à l'infinitif (« Ajouter… », « Corriger… »).

## Avant de terminer

1. `npm run lint`
2. `npm test` (les tests d'intégration demandent une base Postgres avec `DATABASE_URL`)
3. Mettre à jour `PLAN-MVP.txt` si une priorité avance
