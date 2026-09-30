"use client";

import { type FormEvent, useState } from "react";
import { toHiragana } from "wanakana";

import { KanaInput } from "@/components/games/kana-input";
import { RecordLine } from "@/components/games/game-word";
import { useRecord } from "@/lib/games/records";
import { checkPlayerMove, computerMove, endsWithN, lastKana, playableWords } from "@/lib/games/shiritori";
import { GAME_WORDS, type GameWord } from "@/lib/games/words";
import { speakJapanese } from "@/lib/speech";

type Turn = { word: GameWord; by: "moi" | "ordi" };
type Ending = { winner: "moi" | "ordi"; reason: string };

const REASONS = {
  inconnu: "Ce mot n'est pas dans la liste du jeu (mots N5). Essaie un autre mot ou demande un indice.",
  lettre: "Ton mot doit commencer par le bon kana.",
  deja: "Ce mot a déjà été joué.",
};

const randomPick = (words: GameWord[]) => words[Math.floor(Math.random() * words.length)];

// Shiritori contre l'ordinateur : chaque mot commence par le dernier kana du
// mot précédent. Un mot qui finit par ん fait perdre.
export function ShiritoriGame() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState<GameWord | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [isRecord, setIsRecord] = useState(false);
  const { record, submit } = useRecord("shiritori");

  const playerCount = turns.filter((turn) => turn.by === "moi").length;
  const previous = turns.at(-1)?.word;
  const used = new Set(turns.map((turn) => toHiragana(turn.word.kana)));

  function finish(result: Ending, count: number) {
    setEnding(result);
    setIsRecord(count > 0 ? submit(count) : false);
  }

  function start() {
    // L'ordinateur ouvre avec un mot qui a des suites possibles.
    const openers = GAME_WORDS.filter((word) => !endsWithN(word.kana) && playableWords(word.kana, new Set()).length >= 2);
    const first = randomPick(openers);
    speakJapanese(first.kana);
    setTurns([{ word: first, by: "ordi" }]);
    setInput("");
    setError("");
    setHint(null);
    setEnding(null);
    setIsRecord(false);
  }

  function play(event: FormEvent) {
    event.preventDefault();
    if (!previous || ending || !input.trim()) {
      return;
    }
    const result = checkPlayerMove(input, previous.kana, used);
    if (!result.ok) {
      setError(REASONS[result.reason]);
      return;
    }
    const count = playerCount + 1;
    const afterPlayer: Turn[] = [...turns, { word: result.word, by: "moi" }];
    setInput("");
    setError("");
    setHint(null);
    if (endsWithN(result.word.kana)) {
      setTurns(afterPlayer);
      finish({ winner: "ordi", reason: `« ${result.word.kana} » finit par ん : perdu !` }, playerCount);
      return;
    }
    const nowUsed = new Set([...used, toHiragana(result.word.kana)]);
    const answer = computerMove(result.word.kana, nowUsed, randomPick);
    if (!answer) {
      setTurns(afterPlayer);
      finish({ winner: "moi", reason: `L'ordinateur ne connaît plus de mot en « ${lastKana(result.word.kana)} ». Gagné !` }, count);
      return;
    }
    speakJapanese(answer.kana);
    setTurns([...afterPlayer, { word: answer, by: "ordi" }]);
    if (endsWithN(answer.kana)) {
      finish({ winner: "moi", reason: `L'ordinateur a joué « ${answer.kana} », qui finit par ん. Gagné !` }, count);
    }
  }

  function giveUp() {
    if (previous) {
      finish({ winner: "ordi", reason: "Partie abandonnée." }, playerCount);
    }
  }

  function showHint() {
    if (!previous) {
      return;
    }
    const options = playableWords(previous.kana, used);
    setHint(options.length > 0 ? randomPick(options) : null);
    if (options.length === 0) {
      finish({ winner: "ordi", reason: `Aucun mot de la liste ne commence par « ${lastKana(previous.kana)} ».` }, playerCount);
    }
  }

  if (turns.length === 0) {
    return (
      <div className="panel flex flex-col items-start gap-3">
        <p className="text-[var(--ink)]">
          L&apos;ordinateur dit un mot. Réponds par un mot qui commence par son dernier kana : ねこ → こども → もも… Un mot
          qui finit par ん fait perdre. Seuls les mots N5 du jeu comptent ; si tu bloques, demande un indice.
        </p>
        <RecordLine record={record} unit="mots enchaînés" />
        <button type="button" onClick={start} className="primary-button">
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="panel flex flex-col gap-2" aria-label="Mots joués">
        {turns.map((turn) => (
          <li
            key={turn.word.kana}
            className={`flex max-w-[85%] flex-col rounded-xl px-3 py-2 ${
              turn.by === "moi" ? "self-end bg-[var(--success-soft)] text-right" : "self-start bg-[var(--tint)]"
            }`}
          >
            <span className="text-xs text-[var(--muted)]">{turn.by === "moi" ? "Toi" : "Ordinateur"}</span>
            <span className="text-lg font-semibold text-[var(--ink)]" lang="ja">
              {turn.word.written}
              {turn.word.written !== turn.word.kana ? (
                <span className="ml-2 text-sm font-normal text-[var(--muted)]">{turn.word.kana}</span>
              ) : null}
            </span>
            <span className="text-sm text-[var(--muted)]">{turn.word.fr}</span>
          </li>
        ))}
      </ol>

      {ending ? (
        <div className="fade-in-up panel flex flex-col items-start gap-2" role="status">
          <p className="font-bold text-[var(--ink)]">{ending.reason}</p>
          <p className="text-sm text-[var(--muted)]">
            Tu as enchaîné {playerCount} mot{playerCount > 1 ? "s" : ""}.{isRecord ? " Nouveau record 🎉" : ""}
          </p>
          <RecordLine record={record} unit="mots enchaînés" />
          <button type="button" onClick={start} className="primary-button">
            Rejouer
          </button>
        </div>
      ) : previous ? (
        <form onSubmit={play} className="flex flex-col gap-2">
          <p className="text-[var(--ink)]">
            Ton mot doit commencer par{" "}
            <span className="rounded-lg bg-[var(--accent-soft)] px-2 text-2xl font-bold" lang="ja">
              {lastKana(previous.kana)}
            </span>
          </p>
          <div className="flex gap-2">
            <KanaInput value={input} onChange={setInput} label="Ton mot en kana" />
            <button type="submit" className="primary-button shrink-0">
              Jouer
            </button>
          </div>
          {error ? (
            <p className="text-sm text-[var(--accent)]" role="alert">
              {error}
            </p>
          ) : null}
          {hint ? (
            <p className="text-sm text-[var(--muted)]" role="status">
              Indice : un mot qui veut dire « {hint.fr} » ({[...hint.kana].length} kana).
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={showHint} className="secondary-button text-sm!">
              Indice
            </button>
            <button type="button" onClick={giveUp} className="link-button text-sm!">
              Abandonner
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
