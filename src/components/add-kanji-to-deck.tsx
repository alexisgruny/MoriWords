"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth/auth-client";
import type { DeckSummary } from "@/types/shared";

// Dernier deck choisi, pour ne pas le redemander à chaque kanji raté.
const STORAGE_KEY = "moriwords-kanji-deck";

function rememberedDeck(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberDeck(deckId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, deckId);
  } catch {
    // Stockage indisponible : on redemandera le deck la prochaine fois.
  }
}

type State = "idle" | "loading" | "choosing" | "added" | "already" | "no-deck" | "error";

// Bouton « Ajouter ce kanji à un deck » après un exercice (surtout utile
// quand on l'a raté). Le sens et la lecture viennent du référentiel des
// kanji, chargé seulement au clic : pas de traduction par Claude, et pas de
// ~2 200 kanji dans les pages qui n'en ont pas besoin.
// À monter avec key={kanji} pour repartir de zéro à chaque kanji.
export function AddKanjiToDeck({ kanji }: { kanji: string }) {
  const { data: session } = authClient.useSession();
  const [state, setState] = useState<State>("idle");
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [deckId, setDeckId] = useState("");

  if (!session) {
    return null;
  }

  const deckName = decks.find((deck) => deck.id === deckId)?.name ?? "";

  async function add(targetId: string, loaded: DeckSummary[]) {
    setState("loading");
    setDeckId(targetId);
    rememberDeck(targetId);
    // Déjà dans le deck : rien à envoyer (l'ajout mettrait à jour la carte).
    if (loaded.find((deck) => deck.id === targetId)?.cards.some((card) => card.lemma === kanji)) {
      setState("already");
      return;
    }
    try {
      const { JLPT_KANJI } = await import("@/lib/kanji/kanji");
      const entry = JLPT_KANJI.find((candidate) => candidate.kanji === kanji);
      const response = await fetch(`/api/decks/${targetId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lemma: kanji,
          reading: entry ? (entry.kunReadings[0] ?? entry.onReadings[0]) : undefined,
          meaning: entry?.meaning,
        }),
      });
      setState(response.ok ? "added" : "error");
    } catch {
      setState("error");
    }
  }

  async function open() {
    setState("loading");
    try {
      const response = await fetch("/api/decks");
      const data = (await response.json()) as { decks?: DeckSummary[] };
      const loaded = response.ok ? (data.decks ?? []) : null;
      if (!loaded) {
        setState("error");
        return;
      }
      setDecks(loaded);
      if (loaded.length === 0) {
        setState("no-deck");
        return;
      }
      const remembered = rememberedDeck();
      const initial = loaded.find((deck) => deck.id === remembered)?.id ?? loaded[0].id;
      if (loaded.length === 1) {
        await add(initial, loaded);
      } else {
        setDeckId(initial);
        setState("choosing");
      }
    } catch {
      setState("error");
    }
  }

  const box = "mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--ink)]";

  if (state === "choosing") {
    return (
      <div className={box}>
        <label className="flex items-center gap-2">
          <span>
            Ajouter <span lang="ja">{kanji}</span> dans
          </span>
          <select
            value={deckId}
            onChange={(event) => setDeckId(event.target.value)}
            className="min-h-10 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-2 text-[var(--ink)]"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void add(deckId, decks)} className="secondary-button text-sm!">
          Ajouter
        </button>
      </div>
    );
  }

  if (state === "added" || state === "already") {
    return (
      <p className={box} role="status">
        ✓ <span lang="ja">{kanji}</span> {state === "added" ? "ajouté au deck" : "est déjà dans le deck"} «{" "}
        {deckName} ».
        <Link href={`/decks/${deckId}`} className="link-button text-sm!">
          Voir le deck
        </Link>
      </p>
    );
  }

  if (state === "no-deck") {
    return (
      <p className={box}>
        Pas encore de deck.{" "}
        <Link href="/decks" className="link-button text-sm!">
          Créer un deck
        </Link>
      </p>
    );
  }

  return (
    <div className={box}>
      <button type="button" onClick={() => void open()} disabled={state === "loading"} className="secondary-button text-sm!">
        {state === "loading" ? "Ajout…" : (
          <>
            ＋ Ajouter <span lang="ja">{kanji}</span> à un deck
          </>
        )}
      </button>
      {state === "error" ? (
        <span className="text-[var(--accent)]" role="alert">
          L&apos;ajout a échoué, réessaie.
        </span>
      ) : null}
    </div>
  );
}
