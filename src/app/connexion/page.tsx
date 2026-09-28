import { AuthForm } from "@/components/auth-form";
import { isGoogleConfigured } from "@/lib/auth/auth";
import { safeRedirectPath } from "@/lib/auth/redirect";

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const redirectTo = safeRedirectPath((await searchParams).suivant);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-md">
        <header className="fade-in-up mb-6 text-center">
          <h1 className="text-[var(--ink)]">Connexion</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Retrouve tes decks et ta progression.</p>
        </header>
        <AuthForm mode="signin" googleEnabled={isGoogleConfigured} redirectTo={redirectTo} />
      </div>
    </main>
  );
}
