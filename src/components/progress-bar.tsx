import type { CSSProperties } from "react";

// Petite barre de progression colorée selon le taux (vert au-delà de 80%,
// ambre entre 50% et 80%, vermillon en dessous), utilisée par la page
// /exercices/stats pour visualiser un taux de réussite plutôt qu'un simple
// pourcentage en texte.
export function ProgressBar({ rate }: { rate: number }) {
  const clamped = Math.min(1, Math.max(0, rate));
  const color = clamped >= 0.8 ? "var(--success)" : clamped >= 0.5 ? "var(--warning)" : "var(--accent)";
  const fillStyle = { width: `${clamped * 100}%`, "--progress-color": color } as CSSProperties;

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={fillStyle} />
    </div>
  );
}
