"use client";

import type { CSSProperties, ReactNode } from "react";

// Enveloppe un bloc dans une légère apparition (fondu + glissement vers le
// haut) au montage. delayMs permet d'échelonner une liste (voir les cartes
// de tokens sur la page d'accueil) sans avoir à ré-écrire l'animation CSS à
// chaque endroit. Respecte prefers-reduced-motion (voir globals.css).
export function FadeIn({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const style: CSSProperties = delayMs > 0 ? { animationDelay: `${delayMs}ms` } : {};

  return (
    <div className={`fade-in-up ${className}`} style={style}>
      {children}
    </div>
  );
}
