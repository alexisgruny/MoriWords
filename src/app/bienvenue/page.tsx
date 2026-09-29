import type { Metadata } from "next";
import Link from "next/link";

import { LandingDemo } from "@/components/landing-demo";

export const metadata: Metadata = {
  title: "MoriWords · Tes animes deviennent tes cours de japonais",
  description:
    "Colle une réplique d'anime ou un passage de manga : MoriWords t'explique chaque mot en français et en fait des fiches de révision.",
};

// Les trois temps du parcours, dans les mots de Léa (voir PERSONAS.txt).
const STEPS = [
  {
    title: "Colle",
    text: "Une réplique de ton anime, une bulle de manga, les paroles d'une chanson. Ou laisse MoriWords t'en proposer une.",
  },
  {
    title: "Comprends",
    text: "Chaque mot avec sa lecture en hiragana, son sens en français et son niveau JLPT. Fini les ressources en anglais.",
  },
  {
    title: "Retiens",
    text: "Un clic, et le mot devient une fiche, avec des phrases d'exemple. Tu la revois juste avant de l'oublier, 15 minutes par jour suffisent.",
  },
];

const SERIOUS_FEATURES = [
  "Tes traductions en japonais corrigées et expliquées",
  "Un entraînement ciblé sur tes points faibles",
  "Grammaire, conjugaison et plus de 2 000 kanji du JLPT",
  "Export Anki si tu veux garder tes habitudes",
];

// Page d'accueil publique (visiteurs sans compte, voir src/proxy.ts) : le
// premier contact, pensé mobile d'abord.
export default function WelcomePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-14">
        <section className="fade-in-up grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow mb-2">Le japonais, expliqué en français</p>
            <h1 className="text-[var(--ink)]">Tes animes deviennent tes cours de japonais.</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Colle une réplique, MoriWords t&apos;explique chaque mot en français et en fait des fiches de révision.
              Aucun réglage : ta première fiche est prête en moins d&apos;une minute.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className="primary-button text-center">
                Créer mon compte
              </Link>
              <Link href="/connexion" className="secondary-button text-center">
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
          <LandingDemo />
        </section>

        <section>
          <h2 className="text-[var(--ink)]">Comment ça marche</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="panel">
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[var(--ink)]">{step.title}</h3>
                <p className="mt-1 text-[var(--muted)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel">
            <h2 className="text-[var(--ink)]">Tu prépares le JLPT ?</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {SERIOUS_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2 text-[var(--ink)]">
                  <span className="text-[var(--accent)]" aria-hidden="true">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h2 className="text-[var(--ink)]">Pas encore les kana ?</h2>
            <p className="mt-3 text-[var(--muted)]">
              MoriWords suppose que tu sais lire les hiragana et les katakana. Commence par le tableau et
              l&apos;exercice de lecture : c&apos;est ouvert à tous, sans compte.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/kana" className="secondary-button">
                Tableau des kana
              </Link>
              <Link href="/exercices/kana" className="secondary-button">
                S&apos;entraîner à les lire
              </Link>
            </div>
          </div>
        </section>

        <section className="panel text-center">
          <h2 className="text-[var(--ink)]">Prête ou prêt à essayer ?</h2>
          <p className="mt-2 text-[var(--muted)]">Colle ta première réplique dans une minute.</p>
          <Link href="/inscription" className="primary-button mt-5 inline-flex">
            Créer mon compte
          </Link>
        </section>
      </div>
    </main>
  );
}
