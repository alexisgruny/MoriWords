"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";
import type { MasteryKind, MasteryStat } from "@/lib/grammar/mastery";

// Seuils de couleur : acquis dès 80 % de bonnes réponses, fragile dès 50 %.
const GOOD_RATE = 0.8;
const MID_RATE = 0.5;

type Level = "good" | "mid" | "weak";

function levelOf(stat: MasteryStat): Level {
  const rate = stat.correct / stat.total;
  return rate >= GOOD_RATE ? "good" : rate >= MID_RATE ? "mid" : "weak";
}

const LEVEL_LABELS: Record<Level, string> = { good: "acquis", mid: "fragile", weak: "à revoir" };

// Réussite par élément pour une page de référence ; vide sans compte
// connecté (les pages de référence sont publiques).
export function useMastery(kind: MasteryKind): Record<string, MasteryStat> {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<Record<string, MasteryStat>>({});
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/exercise-mastery?kind=${kind}`);
        const data = (await response.json()) as { items?: Record<string, MasteryStat> };

        if (!cancelled && response.ok && data.items) {
          setItems(data.items);
        }
      } catch {
        // Sans couleurs, la page de référence reste utilisable.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, userId]);

  return userId ? items : {};
}

// Classe de la carte d'un élément : rien s'il n'a jamais été essayé.
export function masteryClass(stat: MasteryStat | undefined): string {
  return stat ? `mastery-${levelOf(stat)}` : "";
}

// Texte du résultat, en infobulle et pour les lecteurs d'écran.
export function masteryLabel(stat: MasteryStat | undefined): string | undefined {
  return stat
    ? `${LEVEL_LABELS[levelOf(stat)]} : ${stat.correct} bonne${stat.correct > 1 ? "s" : ""} réponse${stat.correct > 1 ? "s" : ""} sur ${stat.total}`
    : undefined;
}

export function MasteryNote({ stat }: { stat: MasteryStat | undefined }) {
  return stat ? <span className="sr-only">{`, ${masteryLabel(stat)}`}</span> : null;
}

// Légende, affichée seulement quand au moins un élément a été essayé.
export function MasteryLegend({ items }: { items: Record<string, MasteryStat> }) {
  if (Object.keys(items).length === 0) {
    return null;
  }

  return (
    <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted)]">
      <span>Tes exercices :</span>
      {(["good", "mid", "weak"] as const).map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span className={`mastery-${level} inline-block h-3 w-3 rounded-full border`} aria-hidden="true" />
          {LEVEL_LABELS[level]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full border border-[var(--line)]" aria-hidden="true" />
        pas encore essayé
      </span>
    </p>
  );
}
