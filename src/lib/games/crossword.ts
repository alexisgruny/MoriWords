import { GAME_WORDS, HIRAGANA_ONLY, type GameWord } from "@/lib/games/words";

export type Direction = "across" | "down";
export type PlacedWord = { word: GameWord; row: number; col: number; direction: Direction; number: number };
export type Crossword = { rows: number; cols: number; words: PlacedWord[] };

type Placement = { word: GameWord; row: number; col: number; direction: Direction };

const key = (row: number, col: number) => `${row},${col}`;

function cellsOf(placement: Placement): { row: number; col: number; letter: string }[] {
  return [...placement.word.kana].map((letter, index) => ({
    row: placement.row + (placement.direction === "down" ? index : 0),
    col: placement.col + (placement.direction === "across" ? index : 0),
    letter,
  }));
}

// Une pose est valable si elle croise au moins un mot sur la même lettre, sans
// coller un mot parallèle ni prolonger un mot existant.
function fits(grid: Map<string, string>, placement: Placement): boolean {
  const across = placement.direction === "across";
  const cells = cellsOf(placement);
  const before = across ? key(placement.row, placement.col - 1) : key(placement.row - 1, placement.col);
  const lastCell = cells[cells.length - 1];
  const after = across ? key(lastCell.row, lastCell.col + 1) : key(lastCell.row + 1, lastCell.col);
  if (grid.has(before) || grid.has(after)) {
    return false;
  }
  let crossings = 0;
  for (const cell of cells) {
    const existing = grid.get(key(cell.row, cell.col));
    if (existing !== undefined) {
      if (existing !== cell.letter) {
        return false;
      }
      crossings += 1;
      continue;
    }
    const sides = across
      ? [key(cell.row - 1, cell.col), key(cell.row + 1, cell.col)]
      : [key(cell.row, cell.col - 1), key(cell.row, cell.col + 1)];
    if (sides.some((side) => grid.has(side))) {
      return false;
    }
  }
  return crossings > 0 && crossings < cells.length;
}

function tryBuild(candidates: GameWord[], target: number): Placement[] {
  const grid = new Map<string, string>();
  const placed: Placement[] = [];
  const place = (placement: Placement) => {
    placed.push(placement);
    for (const cell of cellsOf(placement)) {
      grid.set(key(cell.row, cell.col), cell.letter);
    }
  };
  place({ word: candidates[0], row: 0, col: 0, direction: "across" });

  for (const word of candidates.slice(1)) {
    if (placed.length >= target) {
      break;
    }
    const letters = [...word.kana];
    let done = false;
    for (const other of placed) {
      if (done) break;
      const direction: Direction = other.direction === "across" ? "down" : "across";
      for (const cell of cellsOf(other)) {
        if (done) break;
        letters.forEach((letter, index) => {
          if (done || letter !== cell.letter) return;
          const placement: Placement = {
            word,
            direction,
            row: direction === "down" ? cell.row - index : cell.row,
            col: direction === "across" ? cell.col - index : cell.col,
          };
          if (fits(grid, placement)) {
            place(placement);
            done = true;
          }
        });
      }
    }
  }
  return placed;
}

// Petite grille de mots croisés en hiragana (sens français comme indice).
// Plusieurs essais au hasard, on garde celui qui place le plus de mots.
export function buildCrossword(random: () => number = Math.random, target = 6): Crossword {
  const pool = GAME_WORDS.filter((word) => HIRAGANA_ONLY.test(word.kana) && word.kana.length >= 2 && word.kana.length <= 5);
  let best: Placement[] = [];
  for (let attempt = 0; attempt < 40 && best.length < target; attempt += 1) {
    const candidates = [...pool].sort(() => random() - 0.5);
    const placed = tryBuild(candidates, target);
    if (placed.length > best.length) {
      best = placed;
    }
  }

  const allCells = best.flatMap(cellsOf);
  const minRow = Math.min(...allCells.map((cell) => cell.row));
  const minCol = Math.min(...allCells.map((cell) => cell.col));
  const rows = Math.max(...allCells.map((cell) => cell.row)) - minRow + 1;
  const cols = Math.max(...allCells.map((cell) => cell.col)) - minCol + 1;

  // Numérotation dans l'ordre de lecture (haut → bas, gauche → droite).
  const shifted = best
    .map((placement) => ({ ...placement, row: placement.row - minRow, col: placement.col - minCol }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const numbers = new Map<string, number>();
  const words = shifted.map((placement) => {
    const start = key(placement.row, placement.col);
    if (!numbers.has(start)) {
      numbers.set(start, numbers.size + 1);
    }
    return { ...placement, number: numbers.get(start) ?? 0 };
  });
  return { rows, cols, words };
}

// Toutes les cases de la grille avec la lettre attendue.
export function solutionCells(crossword: Crossword): Map<string, string> {
  const cells = new Map<string, string>();
  for (const placed of crossword.words) {
    for (const cell of cellsOf(placed)) {
      cells.set(key(cell.row, cell.col), cell.letter);
    }
  }
  return cells;
}

export function wordCells(placed: PlacedWord): string[] {
  return cellsOf(placed).map((cell) => key(cell.row, cell.col));
}

export { key as cellKey };
