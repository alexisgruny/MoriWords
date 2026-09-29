"use client";

import { useSyncExternalStore } from "react";

import { findJapaneseVoice, isSpeechSupported, speakJapanese } from "@/lib/speech";

// Présence d'une voix japonaise, suivie au fil du chargement des voix
// (événement voiceschanged) : sans elle, le bouton ne s'affiche pas plutôt
// que de lire le japonais avec une voix française.
function subscribe(onChange: () => void) {
  if (!isSpeechSupported()) {
    return () => {};
  }
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

function useHasJapaneseVoice(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => findJapaneseVoice() !== undefined,
    () => false,
  );
}

// Bouton 🔊 : lit le texte japonais à voix haute (voix du navigateur).
export function SpeakButton({
  text,
  label = "Écouter",
  size = "md",
  className = "",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const hasVoice = useHasJapaneseVoice();

  if (!hasVoice || !text.trim()) {
    return null;
  }

  const dimension = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <button
      type="button"
      onClick={(event) => {
        // Dans une carte cliquable, écouter ne doit pas aussi sélectionner.
        event.stopPropagation();
        speakJapanese(text);
      }}
      aria-label={`${label} : ${text}`}
      title={label}
      className={`inline-grid ${dimension} shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] ${className}`}
    >
      <svg viewBox="0 0 24 24" width={size === "sm" ? 15 : 18} height={size === "sm" ? 15 : 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}
