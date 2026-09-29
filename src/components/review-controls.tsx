import Link from "next/link";

import { ProgressBar } from "@/components/progress-bar";

// Note SM-2 (0-5) -> libellé et ton du bouton. 0-1 : raté (la carte revient
// vite), 2 : moyen, 3-5 : réussi.
const GRADES = [
  { quality: 0, label: "Encore", tone: "grade-again" },
  { quality: 1, label: "Difficile", tone: "grade-again" },
  { quality: 2, label: "Ok", tone: "grade-hard" },
  { quality: 3, label: "Bien", tone: "grade-good" },
  { quality: 4, label: "Très bien", tone: "grade-good" },
  { quality: 5, label: "Parfait", tone: "grade-good" },
] as const;

export function GradeButtons({
  onGrade,
  disabled,
}: {
  onGrade: (quality: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="fade-in-up w-full">
      <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
        {GRADES.map((grade) => (
          <button
            key={grade.quality}
            type="button"
            onClick={() => onGrade(grade.quality)}
            disabled={disabled}
            className={`grade-button ${grade.tone}`}
          >
            {grade.label}
            <span className="mono text-xs font-medium opacity-60">{grade.quality}</span>
          </button>
        ))}
      </div>
      <p className="keyboard-hint mt-2 text-xs text-[var(--muted)]">
        Raccourci clavier : <span className="kbd">0</span> à <span className="kbd">5</span>.
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
