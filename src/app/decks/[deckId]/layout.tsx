"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";

// Ce que l'en-tête a besoin de savoir sur le deck (le reste est chargé par chaque page).
type DeckHeaderInfo = { name: string; cardCount: number };

// Mise en page commune aux pages d'un deck : titre, boutons pour passer d'une
// fonctionnalité à l'autre (entraînement par défaut, liste des mots,
// statistiques) et actions globales (export Anki, suppression du deck).
export default function DeckLayout({ children }: { children: ReactNode }) {
  const { deckId } = useParams<{ deckId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [deck, setDeck] = useState<DeckHeaderInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDeletionPending, setIsDeletionPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Le layout reste monté quand on passe d'une sous-page à l'autre : le deck
  // n'est rechargé que si on change de deck.
  useEffect(() => {
    let cancelled = false;

    async function loadDeckInfo() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);

        if (response.status === 404) {
          if (!cancelled) {
            setNotFound(true);
          }
          return;
        }

        const data: unknown = await response.json();

        if (
          !cancelled &&
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "deck" in data &&
          typeof data.deck === "object" &&
          data.deck !== null
        ) {
          const loaded = data.deck as { name: string; cards: unknown[] };
          setDeck({ name: loaded.name, cardCount: loaded.cards.length });
        }
      } catch {
        // L'en-tête reste sur "Deck" ; les pages affichent leurs propres erreurs.
      }
    }

    void loadDeckInfo();

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  // Supprime le deck entier (et ses cartes) puis retourne à la liste des decks.
  async function handleDeleteDeck() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("delete failed");
      }

      showToast("Deck supprimé.");
      router.push("/decks");
    } catch {
      showToast("La suppression du deck a échoué.", "error");
      setIsDeleting(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="empty-state">
            <p className="font-medium text-[var(--ink)]">Deck introuvable.</p>
            <Link href="/decks" className="mt-4 primary-button">
              Retour aux decks
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const base = `/decks/${deckId}`;
  const tabs = [
    { href: base, label: "Entraînement" },
    { href: `${base}/mots`, label: "Mots" },
    { href: `${base}/stats`, label: "Statistiques" },
  ];

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/decks" className="eyebrow">
              ← Decks
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              {deck?.name ?? "Deck"}
            </h1>
            {deck ? (
              <p className="mt-2 text-sm text-[var(--muted)]">{deck.cardCount} carte(s)</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={`/api/decks/${deckId}/export/anki`} download className="secondary-button px-4! py-2! text-xs!">
              Exporter vers Anki
            </a>
            <button
              type="button"
              onClick={() => setIsDeletionPending(true)}
              className="secondary-button px-4! py-2! text-xs! text-red-700 hover:bg-red-50"
            >
              Supprimer le deck
            </button>
          </div>
        </header>

        <nav aria-label="Sections du deck" className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>

      <ConfirmDialog
        open={isDeletionPending}
        title="Supprimer ce deck ?"
        description={`« ${deck?.name ?? "Ce deck"} » et ses ${deck?.cardCount ?? 0} carte(s) seront supprimés définitivement.`}
        confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
        danger
        onConfirm={() => {
          setIsDeletionPending(false);
          void handleDeleteDeck();
        }}
        onCancel={() => setIsDeletionPending(false)}
      />
    </main>
  );
}
