"use client";

import { FormEvent, useEffect, useState } from "react";

import type { TokenResult } from "@/lib/tokenizer/types";

const starterText = "私は毎朝コーヒーを飲みながら、日本語を勉強しています。";

type SourceTextSummary = {
  id: string;
  content: string;
  title: string | null;
  createdAt: string;
};

export default function Home() {
  const [text, setText] = useState(starterText);
  const [tokens, setTokens] = useState<TokenResult[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [recentSourceTexts, setRecentSourceTexts] = useState<SourceTextSummary[]>([]);

  const visibleTokens = showParticles
    ? tokens
    : tokens.filter((token) => token.partOfSpeech !== "助詞");

  useEffect(() => {
    async function loadRecentSourceTexts() {
      try {
        const response = await fetch("/api/source-texts");
        const data: unknown = await response.json();

        if (
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "sourceTexts" in data &&
          Array.isArray(data.sourceTexts)
        ) {
          setRecentSourceTexts(data.sourceTexts as SourceTextSummary[]);
        }
      } catch {
        // The analysis remains usable if loading the history fails.
      }
    }

    void loadRecentSourceTexts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSelectedToken(null);

    try {
      const sourceResponse = await fetch("/api/source-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          origin: "manual",
          category: "practice",
        }),
      });
      const sourceData: unknown = await sourceResponse.json();

      if (!sourceResponse.ok || typeof sourceData !== "object" || sourceData === null) {
        throw new Error("Impossible de sauvegarder le texte");
      }

      if ("error" in sourceData && typeof sourceData.error === "string") {
        throw new Error(sourceData.error);
      }

      if (!("sourceText" in sourceData)) {
        throw new Error("Réponse inattendue lors de la sauvegarde");
      }

      setRecentSourceTexts((current) => [
        sourceData.sourceText as SourceTextSummary,
        ...current.filter((sourceText) => sourceText.id !== (sourceData.sourceText as SourceTextSummary).id),
      ].slice(0, 20));

      const tokenizeResponse = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const tokenizeData: unknown = await tokenizeResponse.json();

      if (
        !tokenizeResponse.ok ||
        typeof tokenizeData !== "object" ||
        tokenizeData === null
      ) {
        throw new Error("Analyse impossible");
      }

      if ("error" in tokenizeData && typeof tokenizeData.error === "string") {
        throw new Error(tokenizeData.error);
      }

      if (!("tokens" in tokenizeData) || !Array.isArray(tokenizeData.tokens)) {
        throw new Error("Réponse inattendue du serveur");
      }

      setTokens(tokenizeData.tokens as TokenResult[]);
    } catch (requestError) {
      setTokens([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">MoriWords / 01</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-6xl">
              De la phrase brute au mot compris.
            </h1>
          </div>
          <div className="hidden border-l border-[var(--line)] pl-5 text-right text-sm text-[var(--muted)] sm:block">
            <span className="block text-[var(--ink)]">日本語 → Français</span>
            <span>Analyse morphologique</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <form onSubmit={handleSubmit} className="panel flex flex-col p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Source text</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Colle ton japonais
                </h2>
              </div>
              <span className="status-dot" aria-label="Tokenizer disponible" />
            </div>

            <label htmlFor="japanese-text" className="sr-only">
              Texte japonais à analyser
            </label>
            <textarea
              id="japanese-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="日本語の文章をここに貼り付けてください。"
              className="min-h-72 flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-xl leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              lang="ja"
            />

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[var(--muted)]">
                {text.length} caractères
              </span>
              <button
                type="submit"
                disabled={isLoading || text.trim().length === 0}
                className="primary-button"
              >
                {isLoading ? "Analyse en cours..." : "Analyser le texte"}
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </form>

          <section className="panel min-h-[520px] p-6 sm:p-8" aria-live="polite">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Token map</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Mots détectés
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={showParticles}
                    onChange={(event) => setShowParticles(event.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  Particules
                </label>
                <span className="count-badge">{visibleTokens.length}</span>
              </div>
            </div>

            {tokens.length > 0 ? (
              <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4">
                <p className="eyebrow">Source preview</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink)]" lang="ja">
                  {text}
                </p>
              </div>
            ) : null}

            {tokens.length === 0 ? (
              <div className="empty-state">
                <span className="mb-4 text-4xl" aria-hidden="true">あ</span>
                <p className="font-medium text-[var(--ink)]">
                  Les tokens apparaîtront ici.
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">
                  Chaque mot sera accompagné de sa forme dictionnaire, sa lecture
                  et sa catégorie grammaticale.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleTokens.map((token) => {
                  const isSelected = selectedToken?.position === token.position;

                  return (
                    <button
                      key={`${token.position}-${token.surface}`}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      className={`token-card text-left ${isSelected ? "token-card-selected" : ""}`}
                    >
                      <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                        {token.surface}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--accent)]" lang="ja">
                        {token.reading ?? "lecture inconnue"}
                      </span>
                      <span className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                        <span>{token.baseForm}</span>
                        <span className="part-of-speech">{token.partOfSpeech}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedToken ? (
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <p className="eyebrow">Selected token</p>
                <p className="mt-2 text-lg text-[var(--ink)]" lang="ja">
                  {selectedToken.surface} <span className="text-[var(--muted)]">·</span>{" "}
                  {selectedToken.baseForm}
                </p>
              </div>
            ) : null}
          </section>
        </section>

        {recentSourceTexts.length > 0 ? (
          <section className="mt-8 panel p-6 sm:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Saved texts</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Tes derniers textes
                </h2>
              </div>
              <span className="text-sm text-[var(--muted)]">
                {recentSourceTexts.length} affiché(s)
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recentSourceTexts.map((sourceText) => (
                <article key={sourceText.id} className="token-card">
                  <time className="eyebrow" dateTime={sourceText.createdAt}>
                    {new Date(sourceText.createdAt).toLocaleDateString("fr-FR")}
                  </time>
                  <p className="mt-2 line-clamp-2 text-base leading-7 text-[var(--ink)]" lang="ja">
                    {sourceText.content}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
