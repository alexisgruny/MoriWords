"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { readApiError } from "@/lib/api-error";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/auth/account";
import { authClient } from "@/lib/auth/auth-client";

// Page du compte : informations, export des données (portabilité) et
// suppression définitive (droit à l'effacement).
export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Impossible de supprimer le compte."));
        return;
      }

      // La session a disparu avec le compte : on nettoie aussi le cookie.
      await authClient.signOut().catch(() => undefined);
      router.push("/inscription");
      router.refresh();
    } catch {
      setError("Impossible de supprimer le compte pour le moment.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="fade-in-up">
          <h1 className="text-[var(--ink)]">Mon compte</h1>
        </header>

        <section className="panel">
          <h2 className="text-[var(--ink)]">Informations</h2>
          {isPending ? (
            <div className="skeleton mt-4 h-12 w-64" aria-hidden="true" />
          ) : session ? (
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-[var(--muted)]">Nom</dt>
              <dd className="font-semibold text-[var(--ink)]">{session.user.name}</dd>
              <dt className="text-[var(--muted)]">Email</dt>
              <dd className="font-semibold break-all text-[var(--ink)]">{session.user.email}</dd>
            </dl>
          ) : null}
        </section>

        <section className="panel">
          <h2 className="text-[var(--ink)]">Mes données</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Télécharge tout ce que MoriWords garde pour ton compte (decks, cartes et révisions, textes,
            vocabulaire, exercices) dans un fichier JSON. Pour un deck seul au format Anki, passe par la page du
            deck.
          </p>
          <a href="/api/account" download className="secondary-button mt-4 inline-flex">
            Télécharger mes données
          </a>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Détails dans la{" "}
            <Link href="/confidentialite" className="underline hover:text-[var(--ink)]">
              politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section className="panel border-[color-mix(in_srgb,var(--danger)_45%,var(--line))]">
          <h2 className="text-[var(--ink)]">Supprimer mon compte</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Supprime définitivement ton compte et toutes ses données : decks, cartes, historique de révision,
            textes, vocabulaire et exercices. Impossible à annuler.
          </p>
          <form onSubmit={(event) => void handleDelete(event)} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
              Tape {DELETE_ACCOUNT_CONFIRMATION} pour confirmer
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="min-h-11 w-full max-w-xs border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none"
              />
            </label>

            {error ? (
              <p className="error-banner" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={confirmation !== DELETE_ACCOUNT_CONFIRMATION || isDeleting}
              className="secondary-button self-start border-[var(--danger)] text-[var(--accent-dark)]"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
