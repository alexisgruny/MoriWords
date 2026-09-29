"use client";

import { useState, useSyncExternalStore } from "react";

import { type InstallMode, getInstallMode, promptInstall, subscribeInstall } from "@/lib/install-app";

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribeInstall, getInstallMode, () => "unavailable");
}

// Marche à suivre sur iPhone : Safari n'a pas de bouton d'installation.
function IosSteps() {
  return (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--ink)]">
      <li>
        Touche le bouton <span className="font-semibold">Partager</span> de Safari (le carré avec une flèche vers le
        haut).
      </li>
      <li>
        Choisis <span className="font-semibold">« Sur l&apos;écran d&apos;accueil »</span>.
      </li>
    </ol>
  );
}

// Section « Installer l'app » (page Mon compte) : bouton sur Android/Chrome,
// marche à suivre sur iPhone, rien si c'est déjà installé ou impossible.
export function InstallAppSection() {
  const mode = useInstallMode();

  if (mode === "unavailable") {
    return null;
  }

  return (
    <section className="panel">
      <h2 className="text-[var(--ink)]">L&apos;app sur ton téléphone</h2>
      {mode === "installed" ? (
        <p className="mt-2 text-sm text-[var(--muted)]">MoriWords est installée sur cet appareil ✓</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ajoute MoriWords à ton écran d&apos;accueil : elle s&apos;ouvre en plein écran, comme une app, pour
            réviser en deux secondes.
          </p>
          {mode === "prompt" ? (
            <button type="button" onClick={() => void promptInstall()} className="primary-button mt-4">
              Installer l&apos;app
            </button>
          ) : (
            <IosSteps />
          )}
        </>
      )}
    </section>
  );
}

// Entrée du menu du compte : un bouton sur Android/Chrome, la marche à suivre
// dépliable sur iPhone.
export function InstallAppMenuItem({ onDone }: { onDone: () => void }) {
  const mode = useInstallMode();
  const [showSteps, setShowSteps] = useState(false);

  if (mode !== "prompt" && mode !== "ios") {
    return null;
  }

  const itemClass =
    "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--ink)] hover:bg-[var(--tint)]";

  return mode === "prompt" ? (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onDone();
        void promptInstall();
      }}
      className={itemClass}
    >
      Installer l&apos;app
    </button>
  ) : (
    <div>
      <button type="button" role="menuitem" onClick={() => setShowSteps(!showSteps)} className={itemClass}>
        Installer l&apos;app
      </button>
      {showSteps ? (
        <div className="px-3 pb-2">
          <IosSteps />
        </div>
      ) : null}
    </div>
  );
}
