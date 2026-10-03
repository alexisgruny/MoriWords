import { LESSONS, type Lesson } from "@/lib/course/lessons";
import { N4_LESSONS } from "@/lib/course/n4-lessons";
import { N5_LESSONS, N5_PARTS } from "@/lib/course/n5-lessons";
import type { GrammarLevel } from "@/lib/grammar/points";

// Cours de l'onglet « Leçons », du plus facile au plus avancé. Le parcours
// débutant garde son adresse historique (/parcours) ; les suivants vivent
// sous /lecons/<id>. Pour ajouter un niveau : un fichier de leçons, puis une
// entrée ici (les pages, le sitemap et la validation suivent).
export type Course = {
  id: string;
  title: string;
  level: string;
  summary: string;
  basePath: string;
  lessons: Lesson[];
  // Palier à passer une fois le cours fini.
  examLevel: GrammarLevel;
  // Découpage en parties (sommaire du cours), et objectif affiché en tête.
  parts?: { title: string; lessonIds: string[] }[];
  goal?: string;
};

export const COURSES: Course[] = [
  {
    id: "debutant",
    title: "Parcours débutant",
    level: "Débutant",
    summary: "Des kana à ton premier texte : les bases, en 10 leçons courtes.",
    basePath: "/parcours",
    lessons: LESSONS,
    examLevel: "N5",
  },
  {
    id: "n5",
    title: "Cours N5",
    level: "N5",
    summary: "Tout le programme du JLPT N5 en 16 leçons : nombres, heure, particules, adjectifs, formes des verbes, ～ている, permission, comparaisons, compteurs… avec exercices écrits et les 79 kanji N5.",
    parts: N5_PARTS,
    goal: "Objectif : être capable de passer le JLPT N5 à la fin du cours.",
    basePath: "/lecons/n5",
    lessons: N5_LESSONS,
    examLevel: "N5",
  },
  {
    id: "n4",
    title: "Cours N4",
    level: "N4",
    summary: "Expériences, avis, obligations, conditions et habitudes : la grammaire N4 en 6 leçons.",
    basePath: "/lecons/n4",
    lessons: N4_LESSONS,
    examLevel: "N4",
  },
];

// Toutes les leçons validables (identifiants uniques entre les cours).
export const ALL_LESSON_IDS = new Set(COURSES.flatMap((course) => course.lessons.map((lesson) => lesson.id)));

export function findCourse(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

export function nextCourse(course: Course): Course | undefined {
  return COURSES[COURSES.indexOf(course) + 1];
}
