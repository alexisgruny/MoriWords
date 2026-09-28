"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

// Bouton de compte de la barre de navigation : "Connexion" si personne
// n'est connecté, sinon l'initiale de l'utilisateur avec un petit menu.
export function AccountButton() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Referme le menu au clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  if (isPending) {
    return <span className="skeleton h-9 w-9 rounded-full!" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link href="/connexion" className="chip h-9">
        Connexion
      </Link>
    );
  }

  const { user } = session;
  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();

  async function handleSignOut() {
    setIsOpen(false);
    await authClient.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Compte de ${user.name || user.email}`}
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
      >
        {initial}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="fade-in-up absolute top-11 right-0 z-40 w-60 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-2 shadow-[0_16px_32px_-16px_rgb(0_0_0/0.35)]"
        >
          <div className="border-b border-[var(--line)] px-3 pt-1.5 pb-2.5">
            <p className="truncate font-semibold text-[var(--ink)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className="mt-1 flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--ink)] hover:bg-[var(--tint)]"
          >
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}
