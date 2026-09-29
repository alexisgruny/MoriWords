"use client";

import { useEffect, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";

import { createWriter } from "@/lib/writing/hanzi";
import type { WritingResult } from "@/lib/writing/writing";

const SIZE = 280;

// Tolérance du tracé (1 par défaut dans Hanzi Writer) : ses tracés de
// référence viennent d'une police, un trait écrit à la main (au doigt surtout)
// en diffère toujours un peu. À 1, des kana bien écrits comptaient comme
// faux ; l'ordre et le sens des traits restent vérifiés.
const LENIENCY = 1.8;

// Case d'écriture : l'élève dessine le caractère trait par trait (doigt ou
// souris). Chaque trait est comparé au tracé attendu (forme, sens, ordre) ;
// après 3 essais ratés sur un trait, le bon trait est montré. Tout est corrigé
// dans le navigateur, sans appel à Claude. trace : le modèle est affiché dès
// le départ, pour repasser dessus (entraînement, jamais compté). Monter avec
// key={caractère} pour repartir d'une case vide.
export function WritingCanvas({
  character,
  onComplete,
  trace = false,
}: {
  character: string;
  onComplete?: (result: WritingResult) => void;
  trace?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const assistedRef = useRef(trace);
  const onCompleteRef = useRef(onComplete);
  const [status, setStatus] = useState<{ done: number; total: number; mistakes: number } | null>(null);
  const [isOutlineShown, setIsOutlineShown] = useState(trace);
  const [isDone, setIsDone] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  function startQuiz(writer: HanziWriter) {
    setIsDone(false);
    void writer.quiz({
      leniency: LENIENCY,
      showHintAfterMisses: 3,
      highlightOnComplete: true,
      // strokeNum : le trait qui vient d'être réussi, ou celui en cours s'il est raté.
      onCorrectStroke: (data) =>
        setStatus({ done: data.strokeNum + 1, total: data.strokeNum + 1 + data.strokesRemaining, mistakes: data.totalMistakes }),
      onMistake: (data) =>
        setStatus({ done: data.strokeNum, total: data.strokeNum + data.strokesRemaining, mistakes: data.totalMistakes }),
      onComplete: (summary) => {
        setIsDone(true);
        onCompleteRef.current?.({ mistakes: summary.totalMistakes, assisted: assistedRef.current });
      },
    });
  }

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | null = null;
    const container = containerRef.current;

    async function mount() {
      if (!container) {
        return;
      }
      const created = await createWriter(container, character, {
        width: SIZE,
        height: SIZE,
        showOutline: trace,
        onLoadError: () => setLoadError(true),
      });
      const { writer } = created;
      if (cancelled) {
        created.remove();
        return;
      }
      remove = created.remove;
      writerRef.current = writer;
      startQuiz(writer);
    }

    void mount();

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
      remove?.();
    };
  }, [character, trace]);

  function handleShowOrder() {
    const writer = writerRef.current;
    if (!writer) {
      return;
    }
    assistedRef.current = true;
    writer.cancelQuiz();
    void writer.animateCharacter({
      onComplete: () => {
        void writer.hideCharacter();
        startQuiz(writer);
      },
    });
  }

  function handleToggleOutline() {
    const writer = writerRef.current;
    if (!writer) {
      return;
    }
    if (isOutlineShown) {
      void writer.hideOutline();
    } else {
      assistedRef.current = true;
      void writer.showOutline();
    }
    setIsOutlineShown(!isOutlineShown);
  }

  function handleRestart() {
    const writer = writerRef.current;
    if (writer) {
      setStatus(null);
      startQuiz(writer);
    }
  }

  if (loadError) {
    return <p className="error-banner">Le tracé de ce caractère n&apos;a pas pu être chargé.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Quadrillage d'entraînement, comme un cahier d'écriture japonais. */}
      <div className="relative rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)]" style={{ width: SIZE, height: SIZE }}>
        <svg className="pointer-events-none absolute inset-0" width={SIZE} height={SIZE} aria-hidden="true">
          <line x1={SIZE / 2} y1="0" x2={SIZE / 2} y2={SIZE} stroke="var(--line)" strokeDasharray="6 6" />
          <line x1="0" y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="var(--line)" strokeDasharray="6 6" />
        </svg>
        <div
          ref={containerRef}
          className="relative touch-none"
          role="img"
          aria-label="Case d'écriture : dessine le caractère trait par trait"
        />
      </div>

      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        {isDone && trace
          ? "Bien tracé ! Recommence pour le mémoriser."
          : status
            ? `${status.done} / ${status.total} traits · ${status.mistakes} erreur${status.mistakes > 1 ? "s" : ""}`
            : "Dessine le premier trait."}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {trace ? null : (
          <button type="button" onClick={handleShowOrder} className="chip">
            Voir l&apos;ordre des traits
          </button>
        )}
        <button type="button" onClick={handleToggleOutline} aria-pressed={isOutlineShown} className="chip">
          {isOutlineShown ? "Masquer le modèle" : "Afficher le modèle"}
        </button>
        <button type="button" onClick={handleRestart} className="chip">
          Recommencer
        </button>
      </div>
    </div>
  );
}
