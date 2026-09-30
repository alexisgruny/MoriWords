// Phrases à trous pour le jeu des particules. Les mauvais choix sont écrits à
// la main : on écarte les particules qui seraient aussi correctes (へ avec
// いきます, と avec でんわします…), pour qu'une seule réponse soit juste.
export type ParticleSentence = { before: string; after: string; answer: string; wrong: [string, string, string]; fr: string };

export const PARTICLE_SENTENCES: ParticleSentence[] = [
  { before: "わたし", after: "がくせいです。", answer: "は", wrong: ["を", "に", "で"], fr: "Je suis étudiant." },
  { before: "わたし", after: "がくせいです。", answer: "も", wrong: ["を", "に", "で"], fr: "Moi aussi, je suis étudiant." },
  { before: "パン", after: "たべます。", answer: "を", wrong: ["に", "へ", "で"], fr: "Je mange du pain." },
  { before: "みず", after: "のみます。", answer: "を", wrong: ["に", "へ", "で"], fr: "Je bois de l'eau." },
  { before: "テレビ", after: "みます。", answer: "を", wrong: ["に", "へ", "の"], fr: "Je regarde la télévision." },
  { before: "てがみ", after: "かきます。", answer: "を", wrong: ["に", "へ", "の"], fr: "J'écris une lettre." },
  { before: "がっこう", after: "いきます。", answer: "に", wrong: ["を", "が", "で"], fr: "Je vais à l'école." },
  { before: "いえ", after: "かえります。", answer: "へ", wrong: ["を", "で", "の"], fr: "Je rentre à la maison." },
  { before: "あした、ともだち", after: "あいます。", answer: "に", wrong: ["を", "で", "の"], fr: "Demain, je vois un ami." },
  { before: "つくえのうえ", after: "ほんがあります。", answer: "に", wrong: ["を", "へ", "と"], fr: "Il y a un livre sur le bureau." },
  { before: "ねこ", after: "います。", answer: "が", wrong: ["を", "で", "へ"], fr: "Il y a un chat." },
  { before: "あめ", after: "ふっています。", answer: "が", wrong: ["を", "へ", "で"], fr: "Il pleut." },
  { before: "こうえん", after: "あそびます。", answer: "で", wrong: ["を", "へ", "の"], fr: "Je joue au parc." },
  { before: "としょかん", after: "ほんをよみます。", answer: "で", wrong: ["を", "が", "の"], fr: "Je lis un livre à la bibliothèque." },
  { before: "でんしゃ", after: "がっこうへいきます。", answer: "で", wrong: ["を", "が", "の"], fr: "Je vais à l'école en train." },
  { before: "ともだち", after: "えいがをみます。", answer: "と", wrong: ["を", "へ", "で"], fr: "Je regarde un film avec un ami." },
  { before: "おちゃ", after: "コーヒーをのみます。", answer: "と", wrong: ["に", "へ", "で"], fr: "Je bois du thé et du café." },
  { before: "これはわたし", after: "ほんです。", answer: "の", wrong: ["を", "に", "で"], fr: "C'est mon livre." },
  { before: "かばん", after: "なかにほんがあります。", answer: "の", wrong: ["を", "へ", "で"], fr: "Il y a un livre dans le sac." },
  { before: "ともだち", after: "いえにいきます。", answer: "の", wrong: ["を", "へ", "で"], fr: "Je vais chez mon ami." },
  { before: "せんせい", after: "でんわします。", answer: "に", wrong: ["を", "の", "で"], fr: "Je téléphone au professeur." },
  { before: "やま", after: "たかいです。", answer: "は", wrong: ["を", "に", "へ"], fr: "La montagne est haute." },
];
