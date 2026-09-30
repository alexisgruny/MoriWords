"use client";

import { type FormEvent, useRef, useState } from "react";

import { KanaInput } from "@/components/games/kana-input";
import { RecordLine } from "@/components/games/game-word";
import { type Crossword, buildCrossword, cellKey, solutionCells, wordCells } from "@/lib/games/crossword";
import { useRecord } from "@/lib/games/records";

// Mots croisés en hiragana : l'indice est le sens français. On choisit un mot
// (indice ou case), on le tape en entier, puis on vérifie la grille.
export function CrosswordGame() {
  const [crossword, setCrossword] = useState<Crossword | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState(0);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  // Cases vérifiées : true = juste, false = fausse.
  const [checked, setChecked] = useState<Record<string, boolean> | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { record, submit } = useRecord("mots-croises");

  function start() {
    setCrossword(buildCrossword());
    setEntries({});
    setSelected(0);
    setInput("");
    setMessage("");
    setChecked(null);
    setIsSolved(false);
  }

  if (!crossword) {
    return (
      <div className="panel flex flex-col items-start gap-3">
        <p className="text-[var(--ink)]">
          Une petite grille de mots N5 en hiragana. Choisis un indice (le sens en français), tape le mot en romaji ou en
          kana, puis vérifie ta grille.
        </p>
        <RecordLine record={record} unit="grilles terminées" />
        <button type="button" onClick={start} className="primary-button">
          Commencer
        </button>
      </div>
    );
  }

  const solution = solutionCells(crossword);
  const current = crossword.words[selected];
  const currentCells = new Set(wordCells(current));
  const length = [...current.word.kana].length;

  function select(index: number) {
    setSelected(index);
    setInput("");
    setMessage("");
    inputRef.current?.focus();
  }

  // Toucher une case : choisit un mot qui la contient (l'autre sens au 2e toucher).
  function selectCell(key: string) {
    if (!crossword) return;
    const containing = crossword.words.map((placed, index) => ({ index, cells: wordCells(placed) })).filter((item) => item.cells.includes(key));
    const nextIndex = containing.find((item) => item.index !== selected)?.index ?? containing[0]?.index;
    if (nextIndex !== undefined) {
      select(nextIndex);
    }
  }

  function place(event: FormEvent) {
    event.preventDefault();
    const letters = [...input.trim()];
    if (letters.length !== length) {
      setMessage(`Ce mot fait ${length} kana (tu en as tapé ${letters.length}).`);
      return;
    }
    const next = { ...entries };
    wordCells(current).forEach((key, index) => {
      next[key] = letters[index];
    });
    setEntries(next);
    setChecked(null);
    setInput("");
    setMessage("");
    // Passe au premier mot pas encore rempli.
    const empty = crossword?.words.findIndex((placed) => wordCells(placed).some((key) => !next[key]));
    if (empty !== undefined && empty >= 0) {
      setSelected(empty);
    }
  }

  function check() {
    const result: Record<string, boolean> = {};
    for (const [key, letter] of solution) {
      result[key] = entries[key] === letter;
    }
    setChecked(result);
    if (Object.values(result).every(Boolean) && !isSolved) {
      setIsSolved(true);
      submit((record ?? 0) + 1);
    }
  }

  function reveal() {
    setEntries(Object.fromEntries(solution));
    setChecked(null);
  }

  const cellSize = crossword.cols > 8 ? "2rem" : "2.6rem";
  const across = crossword.words.map((placed, index) => ({ placed, index })).filter((item) => item.placed.direction === "across");
  const down = crossword.words.map((placed, index) => ({ placed, index })).filter((item) => item.placed.direction === "down");
  const numberAt = new Map(crossword.words.map((placed) => [cellKey(placed.row, placed.col), placed.number]));

  return (
    <div className="flex flex-col gap-4">
      <div className="panel overflow-x-auto">
        <div
          className="mx-auto grid w-fit gap-0.5"
          style={{ gridTemplateColumns: `repeat(${crossword.cols}, ${cellSize})`, gridAutoRows: cellSize }}
        >
          {Array.from({ length: crossword.rows * crossword.cols }, (_, position) => {
            const row = Math.floor(position / crossword.cols);
            const col = position % crossword.cols;
            const key = cellKey(row, col);
            if (!solution.has(key)) {
              return <div key={key} aria-hidden="true" />;
            }
            const state = checked?.[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectCell(key)}
                aria-label={`Case ${row + 1}-${col + 1}`}
                lang="ja"
                className={`relative flex cursor-pointer items-center justify-center rounded-md border text-lg font-semibold text-[var(--ink)] ${
                  state === true
                    ? "border-[var(--success)] bg-[var(--success-soft)]"
                    : state === false
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : currentCells.has(key)
                        ? "border-[var(--ink)] bg-[var(--tint)]"
                        : "border-[var(--line-strong)] bg-[var(--paper)]"
                }`}
              >
                {numberAt.has(key) ? (
                  <span className="absolute top-0 left-0.5 text-[0.6rem] leading-none font-normal text-[var(--muted)]">
                    {numberAt.get(key)}
                  </span>
                ) : null}
                {entries[key] ?? ""}
              </button>
            );
          })}
        </div>
      </div>

      {isSolved ? (
        <div className="fade-in-up panel flex flex-wrap items-center gap-3" role="status">
          <p className="font-bold text-[var(--ink)]">Grille terminée, bravo ! 🎉</p>
          <RecordLine record={record} unit="grilles terminées" />
          <button type="button" onClick={start} className="primary-button ml-auto">
            Nouvelle grille
          </button>
        </div>
      ) : (
        <form onSubmit={place} className="panel flex flex-col gap-2">
          <p className="text-[var(--ink)]">
            <span className="font-bold">
              {current.number} {current.direction === "across" ? "→" : "↓"}
            </span>{" "}
            {current.word.fr} <span className="text-sm text-[var(--muted)]">({length} kana)</span>
          </p>
          <div className="flex gap-2">
            <KanaInput value={input} onChange={setInput} label="Mot en kana" inputRef={inputRef} maxLength={length + 2} />
            <button type="submit" className="primary-button shrink-0">
              Placer
            </button>
          </div>
          {message ? (
            <p className="text-sm text-[var(--accent)]" role="alert">
              {message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={check} className="secondary-button text-sm!">
              Vérifier la grille
            </button>
            <button type="button" onClick={reveal} className="link-button text-sm!">
              Voir la solution
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Horizontal →", items: across },
          { title: "Vertical ↓", items: down },
        ].map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold text-[var(--ink)]">{group.title}</h2>
            <ul className="mt-1 flex flex-col gap-1">
              {group.items.map(({ placed, index }) => (
                <li key={placed.word.kana}>
                  <button
                    type="button"
                    onClick={() => select(index)}
                    className={`w-full cursor-pointer rounded-lg px-2 py-1 text-left text-sm text-[var(--ink)] ${
                      index === selected ? "bg-[var(--tint)] font-semibold" : "hover:bg-[var(--tint)]"
                    }`}
                  >
                    {placed.number}. {placed.word.fr}{" "}
                    <span className="text-[var(--muted)]">({[...placed.word.kana].length})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
