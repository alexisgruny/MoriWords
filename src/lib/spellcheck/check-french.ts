// Vérificateur orthographique pour le texte français statique du site
// (grammaire, conjugaison, kanji...). Utilisé par des tests, jamais dans le
// code servi aux utilisateurs (le dictionnaire est trop volumineux pour le
// bundle client) — voir check-french.test.ts.
import nspellFactory from "nspell";
import dictionary from "dictionary-fr";

import { FRENCH_ALLOWLIST } from "./french-allowlist";

// dictionary-fr type ses buffers en Uint8Array, nspell les attend en Buffer :
// même objet en pratique (Buffer étend Uint8Array), juste une divergence
// entre les déclarations de types des deux paquets.
const spell = nspellFactory(dictionary as unknown as { aff: Buffer; dic?: Buffer });

// Un "mot" à vérifier : suites de lettres (accents français et macrons de
// romanisation compris) et d'apostrophes/traits d'union, jamais des chiffres
// ni des caractères japonais (ceux-là ne relèvent pas d'un dictionnaire
// français). Les macrons (ō, ū...) évitent de couper en deux un nom propre
// romanisé comme "Sōseki".
const WORD_PATTERN = /[a-zàâäéèêëïîôöùûüçœæāēīōū]+(?:['’-][a-zàâäéèêëïîôöùûüçœæāēīōū]+)*/gi;

const normalizedAllowlist = new Set([...FRENCH_ALLOWLIST].map((word) => word.toLowerCase()));

// Une élision courante (l'action, d'un, qu'il...) colle l'article/pronom au
// mot suivant dans un seul token : le dictionnaire la gère très bien tout
// seul (l'affixe est dans ses règles), mais notre liste d'exceptions ne
// connaît que le mot nu ("ichidan", pas "l'ichidan") — on la retire donc
// avant de comparer à la liste, jamais avant de vérifier l'orthographe.
const ELISION_PATTERN = /^(?:l|d|j|n|s|c|m|t|qu|jusqu|lorsqu|puisqu)['’]/i;

// Renvoie les mots du texte absents à la fois du dictionnaire français et de
// la liste d'exceptions (termes techniques, noms propres, japonais romanisé).
// Ne détecte pas les erreurs de sens ou de grammaire, seulement les mots qui
// n'existent pas / sont mal orthographiés.
export function findUnknownWords(text: string): string[] {
  const words = text.match(WORD_PATTERN) ?? [];
  const unknown: string[] = [];

  for (const word of words) {
    if (word.length <= 1) {
      continue;
    }

    const withoutElision = word.replace(ELISION_PATTERN, "").toLowerCase();

    if (normalizedAllowlist.has(word.toLowerCase()) || normalizedAllowlist.has(withoutElision)) {
      continue;
    }

    if (!spell.correct(word)) {
      unknown.push(word);
    }
  }

  return unknown;
}
