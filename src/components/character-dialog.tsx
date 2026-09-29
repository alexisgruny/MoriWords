"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";

import { FilterChips } from "@/components/reference-toolbar";
import { WritingCanvas } from "@/components/writing-canvas";
import { createWriter } from "@/lib/writing/hanzi";

const ANIMATION_SIZE = 240;
// Kana combinés (きゃ) : une animation par caractère, plus petites côte à côte.
const SMALL_ANIMATION_SIZE = 150;

type Tab = "animation" | "trace";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "animation", label: "Ordre des traits" },
  { value: "trace", label: "Tracer" },
];

// Animation en boucle de l'ordre des traits, trait par trait.
function StrokeAnimation({ character, size }: { character: string; size: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | null = null;
    const container = containerRef.current;

    async function mount() {
      if (!container) {
        return;
      }
      const created = await createWriter(container, character, {
        width: size,
        height: size,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 350,
        delayBetweenLoops: 1500,
        onLoadError: () => setLoadError(true),
      });
      const { writer } = created;
      if (cancelled) {
        created.remove();
        return;
      }
      remove = created.remove;
      writerRef.current = writer;
      void writer.loopCharacterAnimation();
    }

    void mount();

    return () => {
      cancelled = true;
      void writerRef.current?.pauseAnimation();
      writerRef.current = null;
      remove?.();
    };
  }, [character, size]);

  if (loadError) {
    return <p className="error-banner">Le tracé de ce caractère n&apos;a pas pu être chargé.</p>;
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Animation de l'ordre des traits de ${character}`}
    />
  );
}

// Fenêtre centrée ouverte au clic sur un kana ou un kanji des pages de
// référence : l'ordre des traits animé, puis un onglet pour le tracer
// soi-même par-dessus le modèle (entraînement libre, jamais compté).
export function CharacterDialog({
  character,
  details,
  onClose,
}: {
  character: string | null;
  details?: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("animation");
  const [traceIndex, setTraceIndex] = useState(0);
  const characters = character ? [...character] : [];

  // <dialog> natif : centrage, fond assombri, Échap et focus gérés par le navigateur.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (character && !dialog.open) {
      setTab("animation");
      setTraceIndex(0);
      dialog.showModal();
    } else if (!character && dialog.open) {
      dialog.close();
    }
  }, [character]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clic sur le fond (hors du contenu) : ferme la fenêtre.
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-label={character ? `Tracé de ${character}` : undefined}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-0 text-[var(--ink)] backdrop:bg-black/50"
    >
      {character ? (
        <div className="flex flex-col items-center gap-4 p-5">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-5xl font-bold leading-none" lang="ja">
                {character}
              </p>
              {details ? <div className="mt-2 text-sm text-[var(--muted)]">{details}</div> : null}
            </div>
            <button type="button" onClick={onClose} className="chip shrink-0" aria-label="Fermer">
              ✕
            </button>
          </div>

          <FilterChips options={TABS} value={tab} onChange={setTab} label="Affichage" />

          {tab === "animation" ? (
            <div className="flex gap-3">
              {characters.map((char, index) => (
                <StrokeAnimation
                  key={`${character}-${index}`}
                  character={char}
                  size={characters.length > 1 ? SMALL_ANIMATION_SIZE : ANIMATION_SIZE}
                />
              ))}
            </div>
          ) : (
            <>
              {characters.length > 1 ? (
                <FilterChips
                  options={characters.map((char, index) => ({ value: String(index), label: char }))}
                  value={String(traceIndex)}
                  onChange={(value) => setTraceIndex(Number(value))}
                  label="Caractère à tracer"
                />
              ) : null}
              <WritingCanvas key={`${character}-${traceIndex}`} character={characters[traceIndex]} trace />
            </>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
