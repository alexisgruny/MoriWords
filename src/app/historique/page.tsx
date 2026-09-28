"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { SearchField } from "@/components/reference-toolbar";
import type { SourceTextSummary } from "@/types/shared";

const PAGE_SIZE = 12;

// Libellés lisibles pour l'origine d'un texte, affichés en petit badge.
const ORIGIN_LABELS: Record<string, string> = {
  manual: "Collé à la main",
  "anime-quote": "Citation d'anime",
  "news-summary": "Actualité simplifiée",
  "nippon-news-rss": "Actualité réelle",
  "daily-dialogue": "Dialogue quotidien",
  "literary-excerpt": "Extrait littéraire",
};

// Page listant tout l'historique des textes analysés (contrairement à la
// page d'accueil, qui n'en montre que les 6 derniers), avec une recherche
// sur le titre et le contenu.
export default function HistoriquePage() {
  const [query, setQuery] = useState("");
  // Valeur réellement utilisée pour la recherche, mise à jour 300ms après la
  // dernière frappe : évite de relancer une requête (et le flash de
  // "Chargement...") à chaque caractère tapé.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sourceTexts, setSourceTexts] = useState<SourceTextSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Va chercher une page de résultats (première page si offset est omis).
  async function loadPage(searchQuery: string, offset = 0) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (searchQuery) {
      params.set("q", searchQuery);
    }

    const response = await fetch(`/api/source-texts?${params.toString()}`);
    const data: unknown = await response.json();

    if (!response.ok || typeof data !== "object" || data === null) {
      throw new Error("Impossible de récupérer l’historique");
    }

    if ("error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }

    if (!("sourceTexts" in data) || !Array.isArray(data.sourceTexts)) {
      throw new Error("Réponse inattendue de l’historique");
    }

    return {
      sourceTexts: data.sourceTexts as SourceTextSummary[],
      total: "total" in data && typeof data.total === "number" ? data.total : 0,
      hasMore: "hasMore" in data && typeof data.hasMore === "boolean" ? data.hasMore : false,
    };
  }

  // Attend une pause de frappe avant de répercuter la recherche.
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Relance la recherche depuis le début à chaque changement de requête
  // (une fois la frappe stabilisée, voir l'effet ci-dessus).
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadPage(debouncedQuery);
        if (cancelled) {
          return;
        }
        setSourceTexts(result.sourceTexts);
        setTotal(result.total);
        setHasMore(result.hasMore);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Une erreur est survenue lors du chargement de l’historique.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Charge la page suivante et l'ajoute à la liste déjà affichée.
  async function handleLoadMore() {
    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await loadPage(debouncedQuery, sourceTexts.length);
      setSourceTexts((current) => [...current, ...result.sourceTexts]);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Une erreur est survenue lors du chargement de l’historique.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8">
          <p className="eyebrow mb-1">Historique</p>
          <h1 className="text-[var(--ink)]">Tous tes textes analysés</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Rouvre un texte pour retrouver ses mots et continuer à en ajouter à tes decks.
          </p>
        </header>

        <section className="panel">
          <form onSubmit={handleSubmit} className="mb-3">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Rechercher dans le titre ou le contenu"
              label="Rechercher dans l'historique"
            />
          </form>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {total} texte{total > 1 ? "s" : ""}
          </p>

          {error ? (
            <p className="error-banner mb-4">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 md:gap-x-10">
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
              <div className="skeleton h-28" />
            </div>
          ) : sourceTexts.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {sourceTexts.map((sourceText) => (
                  <Link
                    key={sourceText.id}
                    href={`/?sourceTextId=${sourceText.id}`}
                    className="token-card group mb-0! flex flex-col text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <time className="mono text-xs text-[var(--muted)]" dateTime={sourceText.createdAt}>
                        {new Date(sourceText.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      {sourceText.origin ? (
                        <span className="rounded-full bg-[var(--tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                          {ORIGIN_LABELS[sourceText.origin] ?? sourceText.origin}
                        </span>
                      ) : null}
                    </div>
                    {sourceText.title ? (
                      <p className="mt-1.5 text-sm font-semibold text-[var(--accent-dark)]">{sourceText.title}</p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-base leading-7 text-[var(--ink)]" lang="ja">
                      {sourceText.content}
                    </p>
                    <span className="mt-2 text-xs font-semibold text-[var(--muted)] transition-colors group-hover:text-[var(--accent-dark)]">
                      Rouvrir l’analyse →
                    </span>
                  </Link>
                ))}
              </div>

              {hasMore ? (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingMore}
                    className="secondary-button"
                  >
                    {isLoadingMore ? "Chargement..." : "Charger plus"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h9l3 3v15H6z" />
                  <path d="M9 10h6M9 14h6" />
                </svg>
              </span>
              <p className="font-medium text-[var(--ink)]">
                {debouncedQuery ? "Aucun texte ne correspond à la recherche." : "Aucun texte analysé pour le moment."}
              </p>
              {!debouncedQuery ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <Link href="/" className="link-button text-sm!">
                    Analyse un premier texte
                  </Link>{" "}
                  : il apparaîtra ici.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
