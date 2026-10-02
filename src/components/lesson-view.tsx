import Link from "next/link";

import { LessonExercise, type LessonCourseInfo } from "@/components/lesson-exercise";
import { LessonKanaTable } from "@/components/lesson-kana-table";
import { LessonKanji } from "@/components/lesson-kanji";
import { MarkedText } from "@/components/marked-text";
import { SpeakButton } from "@/components/speak-button";
import { type Course, nextCourse } from "@/lib/course/courses";
import { type Lesson, romajiOf, stripMarks } from "@/lib/course/lessons";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

// Une leçon d'un cours (parcours débutant, cours N4…) : explications et
// exemples lisibles sans compte, vocabulaire, « À retenir », puis
// l'exercice qui la valide.
export function LessonView({ lesson, course }: { lesson: Lesson; course: Course }) {
  const next = course.lessons.find((candidate) => candidate.number === lesson.number + 1);
  const following = nextCourse(course);
  const courseInfo: LessonCourseInfo = {
    basePath: course.basePath,
    title: course.title,
    isBeginner: course.id === "debutant",
    examLevel: course.examLevel,
    next: following ? { title: following.title, href: following.basePath } : null,
  };
  const showRomaji = lesson.exercise.kind !== "kana";
  // Kanji de la leçon : sens et lectures du référentiel (page serveur).
  const lessonKanji = (lesson.kanji ?? [])
    .map((char) => JLPT_KANJI.find((entry) => entry.kanji === char))
    .filter((entry) => entry !== undefined)
    .map((entry) => ({ kanji: entry.kanji, meaning: entry.meaning, onReadings: entry.onReadings, kunReadings: entry.kunReadings }));
  // Sommaire seulement pour les leçons à plusieurs parties.
  const showToc = lesson.sections.length > 1;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="fade-in-up">
          <p className="text-sm">
            <Link href={course.basePath} className="link-button text-sm!">
              ← {course.title}
            </Link>
          </p>
          <p className="eyebrow mt-3">
            {course.level} · Leçon {lesson.number} / {course.lessons.length} · {lesson.minutes} min
          </p>
          <h1 className="mt-1 text-2xl! text-[var(--ink)] sm:text-[2.1rem]!">{lesson.title}</h1>
          <p className="mt-2 text-[var(--muted)]">{lesson.summary}</p>
          {lesson.exercise.kind === "kana" ? (
            <a href="#lesson-kana-title" className="secondary-button mt-4 inline-flex text-sm!">
              Voir le tableau des kana ↓
            </a>
          ) : null}
        </header>

        {showToc ? (
          <nav className="panel py-4!" aria-label="Sommaire de la leçon">
            <p className="eyebrow mb-2">Dans cette leçon</p>
            <ol className="flex flex-col gap-1 text-sm">
              {lesson.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#partie-${index + 1}`} className="link-button text-sm!">
                    {index + 1}. {stripMarks(section.title)}
                  </a>
                </li>
              ))}
              {lessonKanji.length > 0 ? (
                <li>
                  <a href="#lesson-kanji-title" className="link-button text-sm!">
                    Les kanji de la leçon
                  </a>
                </li>
              ) : null}
              <li>
                <a href="#lesson-exercise-title" className="link-button text-sm!">
                  Exercices
                </a>
              </li>
            </ol>
          </nav>
        ) : null}

        {lesson.sections.map((section, index) => (
          <section key={section.title} id={`partie-${index + 1}`} className="panel scroll-mt-4">
            <h2 className="text-lg font-bold text-[var(--ink)]">
              {showToc ? <span className="mr-2 text-[var(--accent)]">{index + 1}.</span> : null}
              <MarkedText text={section.title} />
            </h2>
            {section.formula ? (
              <p className="lesson-formula mt-3 text-[var(--ink)]" lang="ja">
                <span className="eyebrow mr-2">Règle</span>
                <MarkedText text={section.formula} />
              </p>
            ) : null}
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-[1.05rem] leading-8 text-[var(--ink)]">
                <MarkedText text={paragraph} />
              </p>
            ))}
            {section.examples ? (
              <ul className="mt-4 flex flex-col gap-2">
                {section.examples.map((example) => (
                  <li key={example.ja} className="flex items-center gap-3 border-l-2 border-[var(--accent)] py-1 pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg text-[var(--ink)]" lang="ja">
                        <MarkedText text={example.ja} />
                      </p>
                      {example.reading ? (
                        <p className="text-sm text-[var(--muted)]" lang="ja">
                          <MarkedText text={example.reading} />
                        </p>
                      ) : null}
                      {/* Leçons de kana : le romaji est déjà dans la traduction. */}
                      {showRomaji ? (
                        <p className="text-sm text-[var(--accent-dark)] italic">
                          <MarkedText text={romajiOf(example)} />
                        </p>
                      ) : null}
                      <p className="text-sm text-[var(--muted)]">{example.fr}</p>
                    </div>
                    <SpeakButton text={stripMarks(example.reading ?? example.ja)} label="Écouter l'exemple" size="sm" />
                  </li>
                ))}
              </ul>
            ) : null}
            {section.tip ? (
              <p className="lesson-tip mt-4 text-sm leading-6 text-[var(--ink)]">
                <span className="mr-1 font-bold">⚠️ Piège :</span>
                <MarkedText text={section.tip} />
              </p>
            ) : null}
          </section>
        ))}

        {lessonKanji.length > 0 ? <LessonKanji kanji={lessonKanji} /> : null}

        {lesson.exercise.kind === "kana" ? (
          <LessonKanaTable script={lesson.exercise.script} groups={lesson.exercise.groups} />
        ) : null}

        {lesson.vocabulary ? (
          <section className="panel" aria-labelledby="lesson-vocabulary-title">
            <h2 id="lesson-vocabulary-title" className="text-lg font-bold text-[var(--ink)]">
              Le vocabulaire de la leçon
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {courseInfo.isBeginner
                ? "L'exercice n'utilise que ces mots : lis-les et écoute-les d'abord."
                : "Les nouveaux mots de la leçon : lis-les et écoute-les d'abord."}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {lesson.vocabulary.map((word) => (
                <li key={word.ja} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                      {word.ja}
                      {word.reading ? (
                        <span className="ml-2 text-sm font-normal text-[var(--muted)]">{word.reading}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-[var(--accent-dark)] italic">{romajiOf(word)}</p>
                    <p className="text-sm text-[var(--muted)]">{word.fr}</p>
                  </div>
                  <SpeakButton text={word.reading ?? word.ja} label="Écouter le mot" size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {lesson.keyPoints ? (
          <section className="panel border-[var(--accent)]!" aria-labelledby="lesson-key-points-title">
            <h2 id="lesson-key-points-title" className="text-lg font-bold text-[var(--ink)]">
              📌 À retenir
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lesson.keyPoints.map((point) => (
                <li key={point} className="flex gap-2 leading-7 text-[var(--ink)]">
                  <span className="text-[var(--accent)]" aria-hidden="true">
                    •
                  </span>
                  <span>
                    <MarkedText text={point} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <LessonExercise lesson={lesson} nextLesson={next ? { id: next.id, title: next.title } : null} course={courseInfo} />

        {lesson.morePractice ? (
          <p className="text-center text-sm text-[var(--muted)]">
            Pour aller plus loin :{" "}
            <Link href={lesson.morePractice.href} className="link-button text-sm!">
              {lesson.morePractice.label} →
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
