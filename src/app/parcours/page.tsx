import type { Metadata } from "next";

import { CourseOverview } from "@/components/course-overview";
import { LESSONS } from "@/lib/course/lessons";

export const metadata: Metadata = {
  title: "Parcours débutant · MoriWords",
  description: "10 leçons gratuites de 5 à 10 minutes pour apprendre à lire le japonais, des hiragana à ton premier texte.",
};

// Parcours débutant : la porte d'entrée gratuite, lisible sans compte.
export default function CoursePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <header className="fade-in-up">
          <p className="eyebrow">Gratuit · 10 leçons</p>
          <h1 className="mt-1 text-2xl! text-[var(--ink)] sm:text-[2.1rem]!">Parcours débutant</h1>
          <p className="mt-2 text-[var(--muted)]">
            De zéro à ton premier texte en japonais : les kana, les phrases de base, les verbes, les premiers kanji. 5
            à 10 minutes par leçon, chacune validée par un petit exercice.
          </p>
        </header>
        <CourseOverview
          lessons={LESSONS.map(({ id, number, title, minutes, summary }) => ({ id, number, title, minutes, summary }))}
        />
      </div>
    </main>
  );
}
