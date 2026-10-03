import type { Lesson } from "@/lib/course/lessons";
import { N4_LIENS_LESSONS } from "@/lib/course/n4-lessons-liens";
import { N4_NUANCES_LESSONS } from "@/lib/course/n4-lessons-nuances";
import { N4_PARLER_LESSONS } from "@/lib/course/n4-lessons-parler";
import { N4_VERBES_LESSONS } from "@/lib/course/n4-lessons-verbes";

// Cours N4 : après le cours N5, tout le programme du JLPT N4, au même
// format enrichi (règle, partie en couleur, pièges, kanji, QCM puis écrit).
// Écrit à la main (aucun appel à Claude), vérifié par courses.test.ts.
// Ensemble, les leçons couvrent les 166 kanji N4.
export const N4_PARTS: { title: string; lessonIds: string[] }[] = [
  { title: "Parler naturellement", lessonIds: ["n4-style-familier", "n4-experiences", "n4-avis", "n4-intentions"] },
  { title: "Les formes des verbes", lessonIds: ["n4-potentiel", "n4-devoir-pouvoir", "n4-transitifs", "n4-passif", "n4-causatif", "n4-composes"] },
  { title: "Relier les idées", lessonIds: ["n4-conditions", "n4-temps", "n4-raisons", "n4-but"] },
  { title: "Nuancer et interagir", lessonIds: ["n4-donner-recevoir", "n4-habitudes", "n4-supposer", "n4-politesse", "n4-bilan"] },
];

const LESSONS_BY_ID = new Map(
  [...N4_PARLER_LESSONS, ...N4_VERBES_LESSONS, ...N4_LIENS_LESSONS, ...N4_NUANCES_LESSONS].map((lesson) => [lesson.id, lesson]),
);

export const N4_LESSONS: Lesson[] = N4_PARTS.flatMap((part) => part.lessonIds).map((id, index) => {
  const lesson = LESSONS_BY_ID.get(id);
  if (!lesson) {
    throw new Error(`Leçon N4 introuvable : ${id}`);
  }
  return { ...lesson, number: index + 1 };
});
