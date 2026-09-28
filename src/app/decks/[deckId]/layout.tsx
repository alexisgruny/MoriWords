"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { readApiError } from "@/lib/api-error";

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
  const [isExporting, setIsExporting] = useState(false);

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
        throw new Error(await readApiError(response, "Le renommage du deck a échoué."));
      }

      setDeck((current) => (current ? { ...current, name } : current));
      setIsEditingName(false);
      showToast("Deck renommé.");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "Le renommage du deck a échoué.", "error");
    } finally {
      setIsSavingName(false);
    }
  }

  // Télécharge l'export Anki. Un simple lien <a download> n'affiche aucune
  // erreur si la route échoue (l'utilisateur ne voit qu'un rien-ne-se-passe) :
  // on récupère donc le fichier nous-mêmes pour pouvoir montrer un toast si
  // ça échoue, avant de déclencher le téléchargement.
  async function handleExportAnki() {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/decks/${deckId}/export/anki`);

      if (!response.ok) {
        throw new Error("export failed");
      }

      const blob = await response.blob();
      const filenameMatch = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "deck-anki.txt";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      // Certains navigateurs n'émettent l'événement de téléchargement que si
      // le lien est réellement dans le document au moment du clic.
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("L’export vers Anki a échoué.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  // Supprime le deck entier (et ses cartes) puis retourne à la liste des decks.
  async function handleDeleteDeck() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(await readApiError(response, "La suppression du deck a échoué."));
      }

      showToast("Deck supprimé.");
      router.push("/decks");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "La suppression du deck a échoué.", "error");
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
                {deck ? (
                  <h1 className="fade-in-up text-[var(--ink)]">{deck.name}</h1>
                ) : (
                  <div className="skeleton mt-1 h-10 w-56" aria-label="Chargement du deck" />
                )}
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
            <button
              type="button"
              onClick={() => void handleExportAnki()}
              disabled={isExporting}
              className="secondary-button px-4! py-2! text-xs!"
            >
              {isExporting ? "Export..." : "Exporter vers Anki"}
            </button>
            <button
              type="button"
              onClick={() => setIsDeletionPending(true)}
              className="secondary-button px-4! py-2! text-xs! text-[var(--danger)]! hover:bg-[var(--accent-soft)]!"
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
                className={`nav-link -mb-px px-1 text-sm font-semibold transition-colors ${
                  isActive ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
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
