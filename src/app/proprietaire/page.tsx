"use client";

import { FormEvent, useEffect, useState } from "react";

type OwnerStatus = { isOwner: boolean; configured: boolean };

// Déverrouille les actions destructrices (supprimer, renommer, modifier,
// déplacer) sur ce navigateur, en attendant de vrais comptes utilisateurs.
export default function OwnerPage() {
  const [status, setStatus] = useState<OwnerStatus | null>(null);
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchStatus(): Promise<OwnerStatus | null> {
    try {
      const response = await fetch("/api/owner", { cache: "no-store" });
      return (await response.json()) as OwnerStatus;
    } catch {
      return null;
    }
  }

  async function loadStatus() {
    const next = await fetchStatus();

    if (next) {
      setStatus(next);
    } else {
      setMessage({ tone: "error", text: "Impossible de vérifier l'état du mode propriétaire." });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialStatus() {
      const next = await fetchStatus();

      if (cancelled) {
        return;
      }

      if (next) {
        setStatus(next);
      } else {
        setMessage({ tone: "error", text: "Impossible de vérifier l'état du mode propriétaire." });
      }
    }

    void loadInitialStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "Le déverrouillage a échoué." });
        return;
      }

      setSecret("");
      setMessage({ tone: "success", text: "Ce navigateur est déverrouillé." });
      await loadStatus();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLock() {
    await fetch("/api/owner", { method: "DELETE" });
    setMessage({ tone: "success", text: "Ce navigateur est de nouveau verrouillé." });
    await loadStatus();
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-xl">
        <header className="fade-in-up mb-8">
          <p className="eyebrow mb-1">Sécurité</p>
          <h1 className="text-[var(--ink)]">Mode propriétaire</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Tant que le site n&apos;a pas de comptes, supprimer, renommer, modifier ou déplacer
            des decks et des mots est réservé au propriétaire. Saisis ton mot de passe une fois :
            ce navigateur restera déverrouillé.
          </p>
        </header>

        <section className="panel">
          {status === null ? (
            <div className="skeleton h-24" />
          ) : status.isOwner ? (
            <div>
              <p className="flex items-center gap-2 font-semibold text-[var(--success-dark)]">
                <span aria-hidden="true">✓</span> Ce navigateur est déverrouillé.
              </p>
              {status.configured ? (
                <button type="button" onClick={() => void handleLock()} className="secondary-button mt-4">
                  Verrouiller ce navigateur
                </button>
              ) : null}
            </div>
          ) : !status.configured ? (
            <p className="error-banner">
              La protection n&apos;est pas configurée sur ce déploiement : ajoute la variable
              d&apos;environnement OWNER_SECRET dans les réglages Vercel, puis redéploie.
            </p>
          ) : (
            <form onSubmit={(event) => void handleUnlock(event)} className="flex flex-col gap-3">
              <label htmlFor="owner-secret" className="text-sm font-semibold text-[var(--ink)]">
                Mot de passe propriétaire
              </label>
              <input
                id="owner-secret"
                type="password"
                autoComplete="current-password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="min-h-11 border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none"
              />
              <button type="submit" disabled={isSubmitting || secret.length === 0} className="primary-button self-start">
                {isSubmitting ? "Vérification..." : "Déverrouiller"}
              </button>
            </form>
          )}

          {message ? (
            <p
              className={`mt-4 text-sm ${message.tone === "error" ? "text-[var(--accent-dark)]" : "text-[var(--success-dark)]"}`}
              role="status"
            >
              {message.text}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
