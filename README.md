# MoriWords

Pipeline personnel d'apprentissage de langues : texte → tokenization → traduction contextuelle → notebook façon Anki (SM-2) avec image + audio par carte.

MVP : japonais → français. Architecture pensée pour être multi-directionnelle (voir `src/lib/tokenizer/`).

## Stack

- Next.js 16 (App Router) + TypeScript strict
- PostgreSQL + Prisma 7
- Tailwind CSS
- API Claude (Anthropic) pour la traduction contextuelle

## Démarrage

```bash
npm install
npm run dev
```

## Base de données

1. Démarrer une instance PostgreSQL (options : `npx prisma dev` pour un Postgres local géré par Prisma, Docker, ou un service cloud comme Neon/Supabase).
2. Renseigner `DATABASE_URL` dans `.env` (voir `.env` pour le format attendu).
3. `npm run db:migrate` pour appliquer le schéma (à partir de l'étape 3 du projet, une fois `prisma/schema.prisma` rempli).

Scripts disponibles : `db:generate`, `db:migrate`, `db:studio`, `db:push`.

## Structure

```
src/
  app/            routes Next.js (App Router)
  lib/
    tokenizer/    interface Tokenizer + implémentations par langue (étape 2)
    db/           client Prisma singleton (étape 3)
    translation/  appel API Claude + cache de traduction (étape 4)
    srs/          algorithme SM-2 (étape 6)
    images/       recherche d'image complémentaire (étape 7)
    tts/          synthèse vocale (étape 8)
    difficulty/   estimation JLPT/CEFR (étape 10)
    feeds/        alimentation automatique quotidienne (étape 11)
  types/          types partagés
prisma/
  schema.prisma
```

## Note Next.js 16

Ce projet utilise Next.js 16, qui introduit des changements par rapport aux versions précédentes (APIs async pour `params`/`searchParams`, Server Functions, Turbopack par défaut). Voir `node_modules/next/dist/docs/` pour la doc exacte de cette version avant de modifier les conventions de routing.
