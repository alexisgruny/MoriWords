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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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

  // Renomme le deck.
  async function handleRenameDeck() {
    const name = editedName.trim();

    if (!name) {
      return;
    }

    setIsSavingName(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("rename failed");
      }

      setDeck((current) => (current ? { ...current, name } : current));
      setIsEditingName(false);
      showToast("Deck renommé.");
    } catch {
      showToast("Le renommage du deck a échoué.", "error");
    } finally {
      setIsSavingName(false);
    }
  }

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
      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
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
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/decks" className="eyebrow">
              ← Decks
            </Link>
            {isEditingName ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  value={editedName}
                  onChange={(event) => setEditedName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleRenameDeck();
                    }
                    if (event.key === "Escape") {
                      setIsEditingName(false);
                    }
                  }}
                  aria-label="Nom du deck"
                  autoFocus
                  className="min-h-9 border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-xl font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => void handleRenameDeck()}
                  disabled={isSavingName || editedName.trim().length === 0}
                  className="secondary-button px-3! py-1.5! text-xs!"
                >
                  {isSavingName ? "..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="link-button"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <h1 className="text-[var(--ink)]">{deck?.name ?? "Deck"}</h1>
                {deck ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(deck.name);
                      setIsEditingName(true);
                    }}
                    aria-label="Renommer le deck"
                    className="link-button text-sm!"
                  >
                    Renommer
                  </button>
                ) : null}
              </div>
            )}
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
              className="secondary-button px-4! py-2! text-xs!"
            >
              Supprimer le deck
            </button>
          </div>
        </header>

        <nav aria-label="Sections du deck" className="mb-8 flex flex-wrap gap-6 border-b border-[var(--line)]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px border-b-[3px] px-1 pb-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
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
