import Link from "next/link";

import { ProgressBar } from "@/components/progress-bar";

// Quatre choix, comme Anki : six notes (0 à 5) étaient trop pour décider
// vite sur un téléphone, et « Difficile » y valait un échec. Chaque bouton
// donne une note SM-2 : sous 3, la carte est ratée et revient vite.
export const GRADES = [
  { key: "1", quality: 1, label: "À revoir", hint: "oublié", tone: "grade-again" },
  { key: "2", quality: 3, label: "Difficile", hint: "avec effort", tone: "grade-hard" },
  { key: "3", quality: 4, label: "Bien", hint: "je savais", tone: "grade-good" },
  { key: "4", quality: 5, label: "Facile", hint: "sans hésiter", tone: "grade-good" },
] as const;

// Raccourci clavier (1 à 4) -> note SM-2, ou null pour une autre touche.
export function qualityForKey(key: string): number | null {
  return GRADES.find((grade) => grade.key === key)?.quality ?? null;
}

export function GradeButtons({
  onGrade,
  disabled,
}: {
  onGrade: (quality: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="fade-in-up w-full">
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        {GRADES.map((grade) => (
          <button
            key={grade.quality}
            type="button"
            onClick={() => onGrade(grade.quality)}
            disabled={disabled}
            className={`grade-button ${grade.tone}`}
          >
            {grade.label}
            <span className="text-xs font-medium opacity-70">{grade.hint}</span>
          </button>
        ))}
      </div>
      <p className="keyboard-hint mt-2 text-xs text-[var(--muted)]">
        Raccourci clavier : <span className="kbd">1</span> à <span className="kbd">4</span>.
      </p>
    </div>
  );
}

// Avancement de la session en cours : cartes déjà notées depuis l'ouverture
// de la page, sur le total (notées + encore dues). Masqué tant que rien n'a
// été révisé, pour ne pas afficher une barre vide dès l'arrivée.
export function SessionProgress({ reviewed, remaining }: { reviewed: number; remaining: number }) {
  const total = reviewed + remaining;

  if (reviewed === 0 || total === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-baseline justify-between text-xs text-[var(--muted)]">
        <span>Session en cours</span>
        <span className="mono">
          {reviewed} / {total}
        </span>
      </div>
      <ProgressBar rate={reviewed / total} />
    </div>
  );
}

// Écran de fin : distingue "tu viens de tout finir" (au moins une carte
// révisée pendant la session) de "il n'y avait rien à faire en arrivant".
export function ReviewDone({ reviewed, emptyHint }: { reviewed: number; emptyHint: string }) {
  if (reviewed > 0) {
    return (
      <div className="empty-state fade-in-up min-h-48 items-center! text-center!">
        <span className="empty-state-icon bg-[var(--success-soft)]! text-[var(--success-dark)]!" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p className="text-lg font-semibold text-[var(--ink)]">Session terminée !</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {reviewed} carte{reviewed > 1 ? "s" : ""} révisée{reviewed > 1 ? "s" : ""}. Les prochaines reviendront au bon moment.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/exercices" className="secondary-button">
            Faire un exercice
          </Link>
          <Link href="/" className="secondary-button">
            Analyser un texte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="empty-state min-h-48">
      <span className="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      </span>
      <p className="font-medium text-[var(--ink)]">Aucune carte à revoir pour l&apos;instant.</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{emptyHint}</p>
    </div>
  );
}
