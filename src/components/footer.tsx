import Link from "next/link";

// Pied de page affiché en bas de toutes les pages, en miroir de la barre
// de navigation (voir src/components/nav.tsx).
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] px-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
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
          <p className="mt-1 text-xs">
            Kanji : lectures et sens dérivés de KANJIDIC (
            <a
              href="https://www.edrdg.org/edrdg/licence.html"
              target="_blank"
              rel="noreferrer"
              className="underline transition hover:text-[var(--ink)]"
            >
              EDRDG
            </a>
            ) via le paquet{" "}
            <a
              href="https://www.npmjs.com/package/kanji-data"
              target="_blank"
              rel="noreferrer"
              className="underline transition hover:text-[var(--ink)]"
            >
              kanji-data
            </a>{" "}
            (MIT), sens traduits en français par Claude.
          </p>
          <p className="mt-1 text-xs">
            Tracés d&apos;écriture :{" "}
            <a
              href="/strokes/README.txt"
              className="underline transition hover:text-[var(--ink)]"
            >
              animCJK (LGPL) et Make Me a Hanzi (Arphic PL)
            </a>
            , animés avec{" "}
            <a
              href="https://github.com/chanind/hanzi-writer"
              target="_blank"
              rel="noreferrer"
              className="underline transition hover:text-[var(--ink)]"
            >
              Hanzi Writer
            </a>{" "}
            (MIT).
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <a
            href="https://github.com/alexisgruny/MoriWords"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Code source sur GitHub
          </a>
          <div className="flex gap-3 text-xs">
            <Link href="/confidentialite" className="transition hover:text-[var(--ink)]">
              Confidentialité
            </Link>
            <Link href="/mentions-legales" className="transition hover:text-[var(--ink)]">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
