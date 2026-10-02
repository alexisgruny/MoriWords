"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// Bandeau « hors ligne » : sans réseau, les boutons qui appellent le serveur
// (révision, traduction) échouent ; on prévient et on dit ce qui marche
// encore (pages déjà ouvertes, gardées par le service worker).
export function OfflineBanner() {
  // Côté serveur : en ligne (rien à afficher).
  const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (isOnline) {
    return null;
  }
  return (
    <p
      className="border-b border-[var(--line)] bg-[var(--accent-soft)] px-5 py-2 text-center text-sm text-[var(--ink)]"
      role="status"
    >
      📶 Hors ligne : les kana, les mini-jeux et les pages déjà ouvertes marchent encore. Révisions et traductions
      reprendront avec le réseau.
    </p>
  );
}
