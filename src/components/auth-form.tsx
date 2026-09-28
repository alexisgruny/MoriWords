"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

type Mode = "signin" | "signup";

// Messages des codes d'erreur de Better Auth, en français. Un code inconnu
// retombe sur un message générique (jamais le détail technique).
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  INVALID_EMAIL: "Cette adresse email n'est pas valide.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet email. Connecte-toi plutôt.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet email. Connecte-toi plutôt.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit faire au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long (128 caractères maximum).",
};

function errorMessage(error: { code?: string; status?: number } | null | undefined, fallback: string): string {
  if (error?.status === 429) {
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  return (error?.code && ERROR_MESSAGES[error.code]) || fallback;
}

// Formulaire de connexion ou d'inscription (email + mot de passe), avec le
// bouton Google si le serveur l'a configuré.
export function AuthForm({
  mode,
  googleEnabled,
  redirectTo,
}: {
  mode: Mode;
  googleEnabled: boolean;
  // Chemin interne déjà validé (voir safeRedirectPath).
  redirectTo: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = isSignup
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(errorMessage(result.error, isSignup ? "L'inscription a échoué." : "La connexion a échoué."));
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Le service de connexion est injoignable pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await authClient.signIn.social({ provider: "google", callbackURL: redirectTo });

    if (result?.error) {
      setError(errorMessage(result.error, "La connexion avec Google a échoué."));
    }
  }

  const inputClass =
    "min-h-11 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none";

  return (
    <section className="panel">
      {googleEnabled ? (
        <>
          <button
            type="button"
            onClick={() => void handleGoogle()}
            className="secondary-button flex w-full items-center justify-center gap-2.5"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8Z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
            </svg>
            Continuer avec Google
          </button>
          <p className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="h-px flex-1 bg-[var(--line)]" />
            ou avec ton email
            <span className="h-px flex-1 bg-[var(--line)]" />
          </p>
        </>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        {isSignup ? (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
            Prénom ou pseudo
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={60}
              autoComplete="nickname"
              className={inputClass}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={isSignup ? 8 : undefined}
            maxLength={128}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={inputClass}
          />
          {isSignup ? <span className="text-xs font-normal text-[var(--muted)]">8 caractères minimum.</span> : null}
        </label>

        {error ? (
          <p className="error-banner" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="primary-button">
          {isSubmitting ? "Un instant..." : isSignup ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      {isSignup ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          En créant un compte, tu acceptes la{" "}
          <Link href="/confidentialite" className="underline hover:text-[var(--ink)]">
            politique de confidentialité
          </Link>
          .
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-[var(--muted)]">
        {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <Link
          href={`${isSignup ? "/connexion" : "/inscription"}${redirectTo === "/" ? "" : `?suivant=${encodeURIComponent(redirectTo)}`}`}
          className="link-button text-sm!"
        >
          {isSignup ? "Se connecter" : "Créer un compte"}
        </Link>
      </p>
    </section>
  );
}
