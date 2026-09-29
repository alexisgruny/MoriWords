"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "moriwords:kana-hint-dismissed";

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// Pour un compte qui débute (aucune carte) : si les kana ne sont pas encore
// acquis, analyser une réplique n'a pas de sens ; on propose d'abord le
// tableau et l'exercice de kana. Une ligne discrète, qu'on peut masquer.
export function KanaHint() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDismissed()) {
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/today");
        const data = (await response.json()) as { totalCards?: number };
        if (!cancelled && response.ok && data.totalCards === 0) {
          setIsVisible(true);
        }
      } catch {
        // Simple conseil : rien d'affiché si la requête échoue.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <p className="fade-in-up mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
      <span>
        Tu débutes complètement ?{" "}
        <Link href="/parcours" className="link-button text-sm!">
          Commence par le parcours débutant →
        </Link>
      </span>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          try {
            localStorage.setItem(DISMISSED_KEY, "1");
          } catch {
            // Stockage indisponible : le conseil reviendra, sans gravité.
          }
        }}
        className="cursor-pointer text-xs underline hover:text-[var(--ink)]"
      >
        Je sais déjà les lire
      </button>
    </p>
  );
}
