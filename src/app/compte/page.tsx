"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { InstallAppSection } from "@/components/install-app";
import { readApiError } from "@/lib/api-error";
import { forgetCourseStatus } from "@/lib/course/course-status";
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

        <CoursePreference />

        <InstallAppSection />

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
              className="danger-button self-start"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

// « J'ai déjà les bases » : masque le parcours débutant dans le menu (même
// choix qu'à l'inscription, modifiable ici).
function CoursePreference() {
  const [hideCourse, setHideCourse] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    void fetch("/api/course")
      .then((response) => (response.ok ? (response.json() as Promise<{ hideCourse?: boolean }>) : null))
      .then((data) => {
        if (!isCancelled && data) setHideCourse(data.hideCourse === true);
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, []);

  async function toggle(next: boolean) {
    // Coché tout de suite ; remis comme avant si l'enregistrement échoue.
    setHideCourse(next);
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/course", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideCourse: next }),
      });
      if (!response.ok) {
        setHideCourse(!next);
        setError(await readApiError(response, "Impossible d'enregistrer ta préférence."));
        return;
      }
      forgetCourseStatus();
    } catch {
      setHideCourse(!next);
      setError("Impossible d'enregistrer ta préférence pour le moment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="text-[var(--ink)]">Mon niveau</h2>
      <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-[var(--ink)]">
        <input
          type="checkbox"
          checked={hideCourse === true}
          disabled={hideCourse === null || isSaving}
          onChange={(event) => void toggle(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          <span className="font-semibold">J&apos;ai déjà les bases</span>
          <span className="block text-[var(--muted)]">
            Le parcours débutant n&apos;apparaît plus dans le menu (il reste accessible sur{" "}
            <Link href="/parcours" className="underline hover:text-[var(--ink)]">
              /parcours
            </Link>
            ). Il disparaît aussi tout seul une fois terminé ou le palier N5 réussi.
          </span>
        </span>
      </label>
      {error ? (
        <p className="error-banner mt-3" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
