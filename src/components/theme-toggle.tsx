"use client";

// Bascule clair/sombre. Aucun état React : l'icône affichée dépend uniquement
// de CSS (voir globals.css, .theme-toggle-sun/.theme-toggle-moon), qui suit
// déjà la même logique à trois niveaux que les couleurs (préférence système,
// puis data-theme explicite). Ça évite tout risque de désaccord entre le
// rendu serveur et client (le serveur ne connaît ni la préférence système ni
// le choix mémorisé) sans avoir besoin d'un effet.
function getEffectiveTheme(): "light" | "dark" {
  const explicit = document.documentElement.getAttribute("data-theme");

  if (explicit === "light" || explicit === "dark") {
    return explicit;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = getEffectiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);

  try {
    localStorage.setItem("theme", next);
  } catch {
    // Le choix ne survivra pas au rechargement : sans gravité.
  }
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Basculer entre le mode clair et le mode sombre"
      title="Mode clair / sombre"
      className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] transition hover:border-[var(--ink)]"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="theme-toggle-sun"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="theme-toggle-moon"
        aria-hidden="true"
      >
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
