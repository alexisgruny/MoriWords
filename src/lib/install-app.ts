// Installation de MoriWords sur l'écran d'accueil.
// - Android / Chrome / Edge : le navigateur émet une seule fois, tôt,
//   l'événement beforeinstallprompt ; on le garde pour proposer l'installation
//   au moment choisi (bouton), au lieu de la bannière du navigateur.
// - iPhone / iPad (Safari) : pas d'événement, l'installation passe par le
//   bouton Partager ; on affiche la marche à suivre.

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export type InstallMode = "prompt" | "ios" | "installed" | "unavailable";

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isAppleMobile(): boolean {
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function getInstallMode(): InstallMode {
  if (typeof window === "undefined") {
    return "unavailable";
  }
  if (isStandalone()) {
    return "installed";
  }
  if (deferredPrompt) {
    return "prompt";
  }
  return isAppleMobile() ? "ios" : "unavailable";
}

// Ouvre la fenêtre d'installation du navigateur (mode « prompt »).
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  const event = deferredPrompt;
  deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === "accepted";
}
