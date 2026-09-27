"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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

  // Relance la recherche depuis le début à chaque changement de requête.
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadPage(query);
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
  }, [query]);

  // Charge la page suivante et l'ajoute à la liste déjà affichée.
  async function handleLoadMore() {
    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await loadPage(query, sourceTexts.length);
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
        <header className="mb-8">
          <h1 className="text-[var(--ink)]">
            Tous tes textes analysés
          </h1>
        </header>

        <section className="panel">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-[var(--ink)]">Recherche</h2>
            <span className="text-sm text-[var(--muted)]">{total} texte(s)</span>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher dans le titre ou le contenu"
              aria-label="Rechercher dans l'historique"
              className="mb-6 min-h-11 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
            />
          </form>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">Chargement...</p>
            </div>
          ) : sourceTexts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 md:gap-x-10">
                {sourceTexts.map((sourceText) => (
                  <Link
                    key={sourceText.id}
                    href={`/?sourceTextId=${sourceText.id}`}
                    className="token-card block text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <time className="eyebrow" dateTime={sourceText.createdAt}>
                        {new Date(sourceText.createdAt).toLocaleDateString("fr-FR")}
                      </time>
                      {sourceText.origin ? (
                        <span className="rounded-sm border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
                          {ORIGIN_LABELS[sourceText.origin] ?? sourceText.origin}
                        </span>
                      ) : null}
                    </div>
                    {sourceText.title ? (
                      <p className="mt-1 text-xs font-medium text-[var(--accent-dark)]">
                        {sourceText.title}
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-base leading-7 text-[var(--ink)]" lang="ja">
                      {sourceText.content}
                    </p>
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
              <p className="font-medium text-[var(--ink)]">
                {query ? "Aucun texte ne correspond à la recherche." : "Aucun texte analysé pour le moment."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
