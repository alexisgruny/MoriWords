"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Streak = { currentStreak: number; longestStreak: number; reviewedToday: boolean };

// Bandeau de série de révision (jours consécutifs, tous decks confondus).
// Rien ne s'affiche tant qu'il n'y a aucun historique (nouvel utilisateur) :
// pas la peine de culpabiliser quelqu'un qui n'a encore rien à perdre.
export function StreakBanner() {
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStreak() {
      try {
        const response = await fetch("/api/streak");
        const data: unknown = await response.json();

        if (
          !cancelled &&
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "currentStreak" in data &&
          "longestStreak" in data &&
          "reviewedToday" in data
        ) {
          setStreak(data as Streak);
        }
      } catch {
        // Le bandeau reste masqué ; rien d'essentiel n'en dépend.
      }
    }

    void loadStreak();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!streak || (streak.currentStreak === 0 && streak.longestStreak === 0)) {
    return null;
  }

  const isBroken = streak.currentStreak === 0;
  const tone = isBroken || !streak.reviewedToday ? "bg-[var(--accent-soft)]" : "bg-[var(--tint)]";
  const daysLabel = (count: number) => `${count} jour${count > 1 ? "s" : ""}`;

  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${tone}`}>
      <p className="text-sm text-[var(--ink)]">
        {isBroken ? (
          <>
            <span className="font-semibold">Série interrompue.</span> Ta meilleure série était de{" "}
            {daysLabel(streak.longestStreak)} — reprends-la aujourd&apos;hui.
          </>
        ) : streak.reviewedToday ? (
          <>
            <span className="font-semibold">🔥 {daysLabel(streak.currentStreak)} d&apos;affilée.</span> Continue comme ça !
          </>
        ) : (
          <>
            <span className="font-semibold">🔥 {daysLabel(streak.currentStreak)} d&apos;affilée.</span> Révise
            aujourd&apos;hui pour ne pas la perdre.
          </>
        )}
      </p>
      {!streak.reviewedToday ? (
        <Link href="/decks/reviser" className="link-button text-sm!">
          Réviser maintenant →
        </Link>
      ) : null}
    </div>
  );
}
