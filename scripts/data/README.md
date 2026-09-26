# Listes de vocabulaire JLPT N5 / N4

`jlpt-n5.csv` et `jlpt-n4.csv` (colonnes `expression,reading`) servent à séparer
N5 et N4, que le dataset principal (« egg rolls JLPT 10k », package
`@polyglot-bundles/ja-jlpt-syllabi`) fusionne en une seule liste « N5–N4 ».

Source : listes de vocabulaire JLPT de Jonathan Waller (https://www.tanos.co.uk/jlpt/),
sous licence Creative Commons Attribution, reprises via
https://github.com/elzup/jlpt-word-list (MIT, lui-même dérivé de
chyyran/jlpt-anki-decks et jamsinclair/open-anki-jlpt-decks).

Régénérer `src/lib/difficulty/jlpt-vocabulary.ts` : voir l'en-tête de
`scripts/generate-jlpt-vocabulary.mjs`.
