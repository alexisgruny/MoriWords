// Pied de page affiché en bas de toutes les pages, en miroir de la barre
// de navigation (voir src/components/nav.tsx).
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div>
          <p>MoriWords · Analyse et mémorisation du japonais, mot par mot.</p>
          <p className="mt-1 text-xs">
            Niveaux JLPT : listes de{" "}
            <a
              href="https://www.tanos.co.uk/jlpt/"
              target="_blank"
              rel="noreferrer"
              className="underline transition hover:text-[var(--ink)]"
            >
              Jonathan Waller (CC BY)
            </a>{" "}
            et « egg rolls JLPT 10k ».
          </p>
        </div>
        <a
          href="https://github.com/alexisgruny/MoriWords"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--muted)] transition hover:text-[var(--ink)]"
        >
          Code source sur GitHub
        </a>
      </div>
    </footer>
  );
}
