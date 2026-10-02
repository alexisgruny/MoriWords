import type { Lesson } from "@/lib/course/lessons";

// Cours N5 : après le parcours débutant, la grammaire N5 en profondeur.
// Chaque leçon : règle en encadré (formula), exemples où la partie étudiée
// est en couleur ([…]), pièges (tip), vocabulaire, 5 kanji, puis deux
// étapes d'exercice : QCM, puis phrases à écrire en japonais. Tout est
// écrit à la main (aucun appel à Claude) et vérifié par courses.test.ts.
export const N5_LESSONS: Lesson[] = [
  {
    id: "n5-il-y-a",
    number: 1,
    title: "Il y a… : あります et います",
    minutes: 12,
    summary: "Dire qu'une chose ou une personne se trouve quelque part, et situer avec dessus, dessous, dedans, devant, derrière.",
    sections: [
      {
        title: "Objets ou êtres vivants",
        formula: "Nom + が + [あります] (objet)　／　Nom + が + [います] (personne, animal)",
        paragraphs: [
          "Pour dire qu'une chose **existe** ou se trouve quelque part, le japonais a deux verbes : [あります] pour les objets et les plantes, [います] pour les personnes et les animaux.",
          "Ce qui existe est marqué par [が]. Au négatif : [ありません] et [いません] (souvent avec [は] : 猫はいません).",
        ],
        examples: [
          { ja: "机の上に本[があります]。", reading: "つくえのうえにほん[があります]。", romaji: "Tsukue no ue ni hon [ga arimasu].", fr: "Il y a un livre sur le bureau." },
          { ja: "公園に子ども[がいます]。", reading: "こうえんにこども[がいます]。", romaji: "Kouen ni kodomo [ga imasu].", fr: "Il y a des enfants dans le parc." },
          { ja: "部屋に猫は[いません]。", reading: "へやにねこは[いません]。", romaji: "Heya ni neko wa [imasen].", fr: "Il n'y a pas de chat dans la chambre." },
        ],
        tip: "Une personne ou un animal prend toujours [います], même immobile : 犬がいます, jamais 犬があります.",
      },
      {
        title: "Situer : dessus, dessous, dedans…",
        formula: "Lieu + [の上・の下・の中・の前・の後ろ] + に + chose + が あります",
        paragraphs: [
          "Pour situer, on dit littéralement « le dessus **de** A » : A [の上] (sur), A [の下] (sous), A [の中] (dans), A [の前] (devant), A [の後ろ] (derrière).",
          "Le lieu vient en premier, suivi de [に], puis ce qui s'y trouve.",
        ],
        examples: [
          { ja: "かばん[の中に]財布があります。", reading: "かばん[のなかに]さいふがあります。", romaji: "Kaban [no naka ni] saifu ga arimasu.", fr: "Il y a un portefeuille dans le sac." },
          { ja: "駅[の前に]銀行があります。", reading: "えき[のまえに]ぎんこうがあります。", romaji: "Eki [no mae ni] ginkou ga arimasu.", fr: "Il y a une banque devant la gare." },
          { ja: "椅子[の下に]犬がいます。", reading: "いす[のしたに]いぬがいます。", romaji: "Isu [no shita ni] inu ga imasu.", fr: "Il y a un chien sous la chaise." },
        ],
        tip: "L'ordre est inversé par rapport au français : on dit « la gare, son devant » (駅の前), pas « devant la gare ».",
      },
    ],
    vocabulary: [
      { ja: "上", reading: "うえ", fr: "dessus" },
      { ja: "下", reading: "した", fr: "dessous" },
      { ja: "中", reading: "なか", fr: "intérieur, dedans" },
      { ja: "前", reading: "まえ", fr: "devant, avant" },
      { ja: "後ろ", reading: "うしろ", fr: "derrière" },
      { ja: "机", reading: "つくえ", fr: "bureau (meuble)" },
    ],
    kanji: ["上", "下", "中", "前", "後"],
    keyPoints: [
      "Objet : [があります] ; personne ou animal : [がいます].",
      "Situer : lieu + [の上 / の下 / の中 / の前 / の後ろ] + に.",
      "Négatif : [ありません] / [いません].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Il y a un chat sous la table.", answer: "机の下に猫がいます。", wrong: ["机の下に猫があります。", "机の上に猫がいます。"] },
        { fr: "Il y a un livre dans le sac.", answer: "かばんの中に本があります。", wrong: ["かばんの中に本がいます。", "本の中にかばんがあります。"] },
        { fr: "Il y a une banque devant la gare.", answer: "駅の前に銀行があります。", wrong: ["駅の後ろに銀行があります。", "銀行の前に駅があります。"] },
        { fr: "Il y a des enfants dans le parc.", answer: "公園に子どもがいます。", wrong: ["公園に子どもがあります。", "子どもに公園がいます。"] },
        { fr: "Il n'y a pas d'argent dans le portefeuille.", answer: "財布の中にお金がありません。", wrong: ["財布の中にお金がいません。", "財布の中にお金があります。"] },
        { fr: "Il y a un chien derrière la maison.", answer: "家の後ろに犬がいます。", wrong: ["家の前に犬がいます。", "家の後ろに犬があります。"] },
        { fr: "Il y a une photo sur le bureau.", answer: "机の上に写真があります。", wrong: ["机の下に写真があります。", "机の上に写真がいます。"] },
        { fr: "Le professeur est dans la salle de classe.", answer: "先生は教室にいます。", wrong: ["先生は教室にあります。", "教室は先生にいます。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Il y a un chat.", answers: ["猫がいます。", "ねこがいます。"] },
        { fr: "Il y a un livre sur le bureau.", answers: ["机の上に本があります。", "つくえのうえにほんがあります。"] },
        { fr: "Il n'y a pas de chien.", answers: ["犬はいません。", "いぬはいません。", "犬がいません。", "いぬがいません。"] },
        { fr: "Il y a une banque devant la gare.", answers: ["駅の前に銀行があります。", "えきのまえにぎんこうがあります。"] },
        { fr: "Il y a un portefeuille dans le sac.", answers: ["かばんの中に財布があります。", "かばんのなかにさいふがあります。"] },
        { fr: "Il y a des enfants dans le parc.", answers: ["公園に子どもがいます。", "こうえんにこどもがいます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-aru-iru", label: "Plus de phrases avec あります / います" },
  },
  {
    id: "n5-forme-te",
    number: 2,
    title: "La forme en て et ～てください",
    minutes: 15,
    summary: "La forme la plus utile du japonais : la fabriquer pour chaque verbe, puis demander poliment.",
    sections: [
      {
        title: "Fabriquer la forme en て",
        formula: "う・つ・る → [って]　む・ぶ・ぬ → [んで]　く → [いて]　ぐ → [いで]　す → [して]",
        paragraphs: [
          "La **forme en て** sert partout : demander, enchaîner deux actions, dire « en train de ». Elle se fabrique à partir du verbe au dictionnaire.",
          "Verbes en る du groupe 2 (食べる, 見る) : on remplace る par [て] → 食べて, 見て.",
          "Verbes du groupe 1 : tout dépend de la dernière syllabe. う・つ・る → [って] (買う → 買って), む・ぶ・ぬ → [んで] (読む → 読んで), く → [いて] (書く → 書いて), ぐ → [いで] (泳ぐ → 泳いで), す → [して] (話す → 話して).",
          "Irréguliers : する → [して], 来る → [来て].",
        ],
        examples: [
          { ja: "食べる → 食べ[て]", reading: "たべる → たべ[て]", romaji: "taberu → tabe[te]", fr: "manger" },
          { ja: "買う → 買[って]", reading: "かう → か[って]", romaji: "kau → ka[tte]", fr: "acheter" },
          { ja: "読む → 読[んで]", reading: "よむ → よ[んで]", romaji: "yomu → yo[nde]", fr: "lire" },
          { ja: "書く → 書[いて]", reading: "かく → か[いて]", romaji: "kaku → ka[ite]", fr: "écrire" },
          { ja: "話す → 話[して]", reading: "はなす → はな[して]", romaji: "hanasu → hana[shite]", fr: "parler" },
        ],
        tip: "行く est l'exception du groupe en く : [行って], jamais 行いて.",
      },
      {
        title: "Demander poliment : ～てください",
        formula: "Verbe en て + [ください]",
        paragraphs: [
          "Pour demander à quelqu'un de faire quelque chose : forme en て + [ください]. C'est poli, on peut l'utiliser avec un inconnu ou un professeur.",
        ],
        examples: [
          { ja: "ここに名前を書[いてください]。", reading: "ここになまえをか[いてください]。", romaji: "Koko ni namae o ka[ite kudasai].", fr: "Écrivez votre nom ici, s'il vous plaît." },
          { ja: "ゆっくり話[してください]。", reading: "ゆっくりはな[してください]。", romaji: "Yukkuri hana[shite kudasai].", fr: "Parlez lentement, s'il vous plaît." },
          { ja: "ちょっと待[ってください]。", reading: "ちょっとま[ってください]。", romaji: "Chotto ma[tte kudasai].", fr: "Attendez un instant, s'il vous plaît." },
        ],
        tip: "Ne confonds pas 待って (attendre) et 持って (tenir, porter) : seul le premier kanji change.",
      },
    ],
    vocabulary: [
      { ja: "名前", reading: "なまえ", fr: "nom" },
      { ja: "窓", reading: "まど", fr: "fenêtre" },
      { ja: "開ける", reading: "あける", fr: "ouvrir" },
      { ja: "閉める", reading: "しめる", fr: "fermer" },
      { ja: "待つ", reading: "まつ", fr: "attendre" },
      { ja: "教える", reading: "おしえる", fr: "enseigner, indiquer" },
    ],
    kanji: ["名", "書", "話", "読", "見"],
    keyPoints: [
      "う・つ・る → [って], む・ぶ・ぬ → [んで], く → [いて], ぐ → [いで], す → [して].",
      "Groupe 2 : る → [て] ; する → [して], 来る → [来て], 行く → [行って].",
      "Demande polie : forme en て + [ください].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Attendez un instant, s'il vous plaît.", answer: "ちょっと待ってください。", wrong: ["ちょっと待ちてください。", "ちょっと待んでください。"] },
        { fr: "Écrivez votre nom ici.", answer: "ここに名前を書いてください。", wrong: ["ここに名前を書きてください。", "ここに名前を書ってください。"] },
        { fr: "Lisez ce livre.", answer: "この本を読んでください。", wrong: ["この本を読みてください。", "この本を読ってください。"] },
        { fr: "Ouvrez la fenêtre, s'il vous plaît.", answer: "窓を開けてください。", wrong: ["窓を開けってください。", "窓を開けんでください。"] },
        { fr: "Parlez lentement.", answer: "ゆっくり話してください。", wrong: ["ゆっくり話いてください。", "ゆっくり話ってください。"] },
        { fr: "Allez-y, s'il vous plaît.", answer: "行ってください。", wrong: ["行いてください。", "行んでください。"] },
        { fr: "Venez demain.", answer: "明日来てください。", wrong: ["明日来ってください。", "明日来りてください。"] },
        { fr: "Indiquez-moi le chemin, s'il vous plaît.", answer: "道を教えてください。", wrong: ["道を教えってください。", "道を教えいてください。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Attendez, s'il vous plaît.", answers: ["待ってください。", "まってください。"] },
        { fr: "Écrivez ici, s'il vous plaît.", answers: ["ここに書いてください。", "ここにかいてください。"] },
        { fr: "Fermez la fenêtre, s'il vous plaît.", answers: ["窓を閉めてください。", "まどをしめてください。"] },
        { fr: "Lisez, s'il vous plaît.", answers: ["読んでください。", "よんでください。"] },
        { fr: "Venez, s'il vous plaît.", answers: ["来てください。", "きてください。"] },
        { fr: "Parlez lentement, s'il vous plaît.", answers: ["ゆっくり話してください。", "ゆっくりはなしてください。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-kudasai", label: "Plus de phrases avec ～てください" },
  },
  {
    id: "n5-en-cours",
    number: 3,
    title: "En ce moment, et pour durer : ～ている",
    minutes: 12,
    summary: "Dire ce qu'on est en train de faire, et décrire un état qui dure (habiter, savoir, être marié).",
    sections: [
      {
        title: "Une action en cours",
        formula: "Verbe en て + [います]",
        paragraphs: [
          "Forme en て + [います] : l'action est **en train de se faire**. 読んでいます = je suis en train de lire.",
          "À l'oral, le い disparaît souvent : 読んでる, 待ってる.",
        ],
        examples: [
          { ja: "今、本を読[んでいます]。", reading: "いま、ほんをよ[んでいます]。", romaji: "Ima, hon o yo[nde imasu].", fr: "Je suis en train de lire un livre." },
          { ja: "雨が降[っています]。", reading: "あめがふ[っています]。", romaji: "Ame ga fu[tte imasu].", fr: "Il pleut (en ce moment)." },
          { ja: "友達を待[っています]。", reading: "ともだちをま[っています]。", romaji: "Tomodachi o ma[tte imasu].", fr: "J'attends un ami." },
        ],
      },
      {
        title: "Un état qui dure",
        formula: "住む → [住んでいます]　知る → [知っています]",
        paragraphs: [
          "Avec certains verbes, ～ています décrit un **état** et non une action : 住む (habiter) → 住んでいます (j'habite), 知る (savoir, connaître) → 知っています (je sais), 結婚する → 結婚しています (je suis marié·e).",
        ],
        examples: [
          { ja: "東京に住[んでいます]。", reading: "とうきょうにす[んでいます]。", romaji: "Toukyou ni su[nde imasu].", fr: "J'habite à Tokyo." },
          { ja: "その人を知[っています]。", reading: "そのひとをし[っています]。", romaji: "Sono hito o shi[tte imasu].", fr: "Je connais cette personne." },
        ],
        tip: "Le négatif de 知っています est [知りません], pas 知っていません.",
      },
    ],
    vocabulary: [
      { ja: "今", reading: "いま", fr: "maintenant" },
      { ja: "知る", reading: "しる", fr: "savoir, connaître" },
      { ja: "住む", reading: "すむ", fr: "habiter" },
      { ja: "働く", reading: "はたらく", fr: "travailler" },
      { ja: "電話", reading: "でんわ", fr: "téléphone" },
      { ja: "結婚", reading: "けっこん", fr: "mariage" },
    ],
    kanji: ["今", "人", "雨", "電", "車"],
    keyPoints: [
      "En train de : forme en て + [います] (読んでいます).",
      "État qui dure : [住んでいます], [知っています], [結婚しています].",
      "« Je ne sais pas » : [知りません].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Il neige (en ce moment).", answer: "雪が降っています。", wrong: ["雪が降ります。", "雪が降ってください。"] },
        { fr: "Je suis en train de manger.", answer: "今、食べています。", wrong: ["今、食べてください。", "今、食べました。"] },
        { fr: "J'habite à Osaka.", answer: "大阪に住んでいます。", wrong: ["大阪に住みます。", "大阪に住んでください。"] },
        { fr: "Je ne sais pas.", answer: "知りません。", wrong: ["知っていません。", "知らないています。"] },
        { fr: "Mon grand frère est en train de téléphoner.", answer: "兄は電話をしています。", wrong: ["兄は電話をします。", "兄は電話をしてください。"] },
        { fr: "Je connais ce restaurant.", answer: "そのレストランを知っています。", wrong: ["そのレストランを知ります。", "そのレストランを知っていません。"] },
        { fr: "Il pleut depuis ce matin.", answer: "朝から雨が降っています。", wrong: ["朝から雨が降ります。", "朝まで雨が降ってください。"] },
        { fr: "J'attends le bus.", answer: "バスを待っています。", wrong: ["バスを待ちています。", "バスを待んでいます。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Il pleut.", answers: ["雨が降っています。", "あめがふっています。"] },
        { fr: "Je suis en train de lire.", answers: ["読んでいます。", "よんでいます。"] },
        { fr: "J'habite à Paris.", answers: ["パリに住んでいます。", "パリにすんでいます。"] },
        { fr: "Je sais (je connais).", answers: ["知っています。", "しっています。"] },
        { fr: "Je ne sais pas.", answers: ["知りません。", "しりません。"] },
        { fr: "J'attends un ami.", answers: ["友達を待っています。", "ともだちをまっています。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-iru", label: "Plus de phrases avec ～ている" },
  },
  {
    id: "n5-permis-interdit",
    number: 4,
    title: "Permis ou interdit : ～てもいい, ～ないでください",
    minutes: 12,
    summary: "Demander la permission (« je peux ? »), et demander de ne pas faire quelque chose.",
    sections: [
      {
        title: "Demander la permission",
        formula: "Verbe en て + [もいいです] (+ か pour demander)",
        paragraphs: [
          "Forme en て + [もいいです] : « on peut, c'est permis ». Avec か à la fin, c'est la question « est-ce que je peux… ? ».",
          "Pour dire oui : はい、いいですよ. Pour refuser poliment : すみません、ちょっと…",
        ],
        examples: [
          { ja: "ここで写真を撮[ってもいいですか]。", reading: "ここでしゃしんをと[ってもいいですか]。", romaji: "Koko de shashin o to[tte mo ii desu ka].", fr: "Est-ce que je peux prendre des photos ici ?" },
          { ja: "もう帰[ってもいいです]。", reading: "もうかえ[ってもいいです]。", romaji: "Mou kae[tte mo ii desu].", fr: "Tu peux rentrer maintenant." },
        ],
      },
      {
        title: "Demander de ne pas faire",
        formula: "Verbe en ない + [でください]",
        paragraphs: [
          "Forme en ない + [でください] : « ne… pas, s'il vous plaît ».",
          "La forme en ない : groupe 1, la dernière syllabe passe en -a puis ない (書く → 書かない, 走る → 走らない, 買う → 買わない) ; groupe 2, る → ない (食べる → 食べない) ; する → しない, 来る → 来ない.",
        ],
        examples: [
          { ja: "ここで走[らないでください]。", reading: "ここではし[らないでください]。", romaji: "Koko de hashi[ranaide kudasai].", fr: "Ne courez pas ici, s'il vous plaît." },
          { ja: "心配し[ないでください]。", reading: "しんぱいし[ないでください]。", romaji: "Shinpai shi[naide kudasai].", fr: "Ne vous inquiétez pas." },
        ],
        tip: "Les verbes en う donnent わない, pas あない : 買う → [買わない].",
      },
    ],
    vocabulary: [
      { ja: "写真", reading: "しゃしん", fr: "photo" },
      { ja: "撮る", reading: "とる", fr: "prendre (une photo)" },
      { ja: "走る", reading: "はしる", fr: "courir" },
      { ja: "入る", reading: "はいる", fr: "entrer" },
      { ja: "休む", reading: "やすむ", fr: "se reposer" },
      { ja: "座る", reading: "すわる", fr: "s'asseoir" },
    ],
    kanji: ["休", "入", "出", "先", "生"],
    keyPoints: [
      "Permission : forme en て + [もいいですか].",
      "Interdiction polie : forme en ない + [でください].",
      "Forme en ない : 書く → [書かない], 買う → [買わない], 食べる → [食べない].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Est-ce que je peux m'asseoir ici ?", answer: "ここに座ってもいいですか。", wrong: ["ここに座らないでください。", "ここに座ってください。"] },
        { fr: "Ne fumez pas ici, s'il vous plaît.", answer: "ここでたばこを吸わないでください。", wrong: ["ここでたばこを吸ってもいいです。", "ここでたばこを吸あないでください。"] },
        { fr: "Tu peux manger.", answer: "食べてもいいです。", wrong: ["食べないでください。", "食べてもいいですか。"] },
        { fr: "N'entrez pas, s'il vous plaît.", answer: "入らないでください。", wrong: ["入ってください。", "入りないでください。"] },
        { fr: "Puis-je ouvrir la fenêtre ?", answer: "窓を開けてもいいですか。", wrong: ["窓を開けないでください。", "窓を開けってもいいですか。"] },
        { fr: "Ne vous inquiétez pas.", answer: "心配しないでください。", wrong: ["心配してください。", "心配しなくてください。"] },
        { fr: "Est-ce que je peux me reposer ?", answer: "休んでもいいですか。", wrong: ["休みてもいいですか。", "休まないでください。"] },
        { fr: "Ne parlez pas en classe, s'il vous plaît.", answer: "教室で話さないでください。", wrong: ["教室で話してもいいです。", "教室で話しないでください。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Est-ce que je peux entrer ?", answers: ["入ってもいいですか。", "はいってもいいですか。"] },
        { fr: "N'entrez pas, s'il vous plaît.", answers: ["入らないでください。", "はいらないでください。"] },
        { fr: "Tu peux rentrer.", answers: ["帰ってもいいです。", "かえってもいいです。"] },
        { fr: "Ne courez pas, s'il vous plaît.", answers: ["走らないでください。", "はしらないでください。"] },
        { fr: "Est-ce que je peux prendre une photo ?", answers: ["写真を撮ってもいいですか。", "しゃしんをとってもいいですか。"] },
        { fr: "Ne vous inquiétez pas.", answers: ["心配しないでください。", "しんぱいしないでください。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-mo-ii", label: "Plus de phrases avec ～てもいい" },
  },
  {
    id: "n5-comparer",
    number: 5,
    title: "Comparer : より, のほうが, いちばん",
    minutes: 12,
    summary: "Dire que B est plus… que A, demander lequel on préfère, et dire « le plus ».",
    sections: [
      {
        title: "Plus… que : より et のほうが",
        formula: "A [より] B [のほうが] + adjectif",
        paragraphs: [
          "A [より] B [のほうが] + adjectif = « B est plus … que A ». より se place juste après ce qui est **moins** fort.",
          "Pour demander lequel des deux : A と B と、[どちらが] + adjectif + ですか.",
        ],
        examples: [
          { ja: "電車[より]バス[のほうが]安いです。", reading: "でんしゃ[より]バス[のほうが]やすいです。", romaji: "Densha [yori] basu [no hou ga] yasui desu.", fr: "Le bus est moins cher que le train." },
          { ja: "夏[より]冬[のほうが]好きです。", reading: "なつ[より]ふゆ[のほうが]すきです。", romaji: "Natsu [yori] fuyu [no hou ga] suki desu.", fr: "Je préfère l'hiver à l'été." },
          { ja: "犬と猫と、[どちらが]好きですか。", reading: "いぬとねこと、[どちらが]すきですか。", romaji: "Inu to neko to, [dochira ga] suki desu ka.", fr: "Tu préfères les chiens ou les chats ?" },
        ],
        tip: "より suit ce qui est le **moins** : 電車より安い = « moins cher que le train ».",
      },
      {
        title: "Le plus : いちばん",
        formula: "Groupe + の中で + A が [いちばん] + adjectif",
        paragraphs: ["[いちばん] (一番, « numéro un ») veut dire « le plus ». Le groupe dans lequel on compare se dit avec の中で (« parmi ») ou で (« dans »)."],
        examples: [
          { ja: "果物の中で、りんごが[いちばん]好きです。", reading: "くだもののなかで、りんごが[いちばん]すきです。", romaji: "Kudamono no naka de, ringo ga [ichiban] suki desu.", fr: "Parmi les fruits, c'est la pomme que je préfère." },
          { ja: "富士山は日本で[いちばん]高い山です。", reading: "ふじさんはにほんで[いちばん]たかいやまです。", romaji: "Fujisan wa Nihon de [ichiban] takai yama desu.", fr: "Le mont Fuji est la plus haute montagne du Japon." },
        ],
      },
    ],
    vocabulary: [
      { ja: "夏", reading: "なつ", fr: "été" },
      { ja: "冬", reading: "ふゆ", fr: "hiver" },
      { ja: "果物", reading: "くだもの", fr: "fruit" },
      { ja: "高い", reading: "たかい", fr: "cher, haut" },
      { ja: "安い", reading: "やすい", fr: "bon marché" },
      { ja: "一番", reading: "いちばん", fr: "le plus, numéro un" },
    ],
    kanji: ["大", "小", "高", "長", "山"],
    keyPoints: [
      "B est plus … que A : A [より] B [のほうが] + adjectif.",
      "Lequel des deux ? A と B と、[どちらが]… ですか.",
      "Le plus : [いちばん] + adjectif.",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Le bus est moins cher que le train.", answer: "電車よりバスのほうが安いです。", wrong: ["バスより電車のほうが安いです。", "電車よりバスのほうが高いです。"] },
        { fr: "Je préfère l'été à l'hiver.", answer: "冬より夏のほうが好きです。", wrong: ["夏より冬のほうが好きです。", "冬のほうが夏より好きです。"] },
        { fr: "Tu préfères le thé ou le café ?", answer: "お茶とコーヒーと、どちらが好きですか。", wrong: ["お茶よりコーヒーが好きですか。", "お茶とコーヒーと、どこが好きですか。"] },
        { fr: "De toute l'année, c'est le printemps que je préfère.", answer: "一年で、春がいちばん好きです。", wrong: ["一年で、春より好きです。", "一年で、春のほうが好きです。"] },
        { fr: "Tokyo est plus grand qu'Osaka.", answer: "大阪より東京のほうが大きいです。", wrong: ["東京より大阪のほうが大きいです。", "大阪より東京のほうが小さいです。"] },
        { fr: "Le mont Fuji est la plus haute montagne du Japon.", answer: "富士山は日本でいちばん高い山です。", wrong: ["富士山は日本より高い山です。", "富士山は日本のほうが高い山です。"] },
        { fr: "Le japonais est plus difficile que l'anglais.", answer: "英語より日本語のほうが難しいです。", wrong: ["日本語より英語のほうが難しいです。", "英語のほうが日本語より難しいです。"] },
        { fr: "Lequel est le plus cher ?", answer: "どちらが高いですか。", wrong: ["どちらより高いですか。", "どこが高いですか。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Le bus est moins cher que le train.", answers: ["電車よりバスのほうが安いです。", "でんしゃよりバスのほうがやすいです。"] },
        { fr: "Je préfère les chats aux chiens.", answers: ["犬より猫のほうが好きです。", "いぬよりねこのほうがすきです。"] },
        { fr: "C'est le plus cher.", answers: ["いちばん高いです。", "一番高いです。", "いちばんたかいです。"] },
        { fr: "Tu préfères l'été ou l'hiver ?", answers: ["夏と冬と、どちらが好きですか。", "なつとふゆと、どちらがすきですか。"] },
        { fr: "Le japonais est plus difficile que le français.", answers: ["フランス語より日本語のほうが難しいです。", "フランスごよりにほんごのほうがむずかしいです。"] },
        { fr: "Je préfère l'hiver à l'été.", answers: ["夏より冬のほうが好きです。", "なつよりふゆのほうがすきです。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-yori-hou-ga", label: "Plus de phrases avec より / のほうが" },
  },
  {
    id: "n5-raison-proposer",
    number: 6,
    title: "Donner une raison, proposer : から, ～ましょう, ～ませんか",
    minutes: 12,
    summary: "Expliquer pourquoi (« parce que »), proposer de faire quelque chose ensemble, inviter.",
    sections: [
      {
        title: "Parce que : から",
        formula: "Raison + [から]、conséquence",
        paragraphs: [
          "[から] après une phrase = « parce que ». La raison vient **avant**, la conséquence après : 忙しいですから、行きません (je suis occupé·e, donc je n'y vais pas).",
          "Pour répondre à « pourquoi ? » (どうして), on peut s'arrêter sur から : 忙しいですから.",
        ],
        examples: [
          { ja: "忙しいです[から]、行きません。", reading: "いそがしいです[から]、いきません。", romaji: "Isogashii desu [kara], ikimasen.", fr: "Je n'y vais pas parce que je suis occupé·e." },
          { ja: "雨です[から]、タクシーで帰ります。", reading: "あめです[から]、タクシーでかえります。", romaji: "Ame desu [kara], takushii de kaerimasu.", fr: "Comme il pleut, je rentre en taxi." },
        ],
        tip: "L'ordre est inverse du français « parce que » : la raison d'abord, puis から, puis ce qu'on fait.",
      },
      {
        title: "Proposer : ～ましょう et ～ませんか",
        formula: "Verbe en ます sans ます + [ましょう] / [ませんか]",
        paragraphs: [
          "[～ましょう] : « faisons… ! », quand on est d'accord pour le faire ensemble. [～ませんか] : « et si on… ? », une invitation plus douce qui laisse le choix.",
          "Pour accepter : いいですね ! Pour refuser poliment : すみません、ちょっと…",
        ],
        examples: [
          { ja: "一緒に食べ[ましょう]。", reading: "いっしょにたべ[ましょう]。", romaji: "Issho ni tabe[mashou].", fr: "Mangeons ensemble." },
          { ja: "映画を見に行き[ませんか]。", reading: "えいがをみにいき[ませんか]。", romaji: "Eiga o mi ni iki[masen ka].", fr: "Et si on allait voir un film ?" },
          { ja: "そろそろ帰り[ましょう]。", reading: "そろそろかえり[ましょう]。", romaji: "Sorosoro kaeri[mashou].", fr: "Rentrons, il est temps." },
        ],
        tip: "～ませんか ressemble à une négation, mais c'est une **invitation** : « tu ne voudrais pas… ? » = « et si on… ? ».",
      },
    ],
    vocabulary: [
      { ja: "忙しい", reading: "いそがしい", fr: "occupé" },
      { ja: "一緒", reading: "いっしょ", fr: "ensemble (一緒に)" },
      { ja: "映画", reading: "えいが", fr: "film" },
      { ja: "暇", reading: "ひま", fr: "libre, disponible" },
      { ja: "どうして", reading: "どうして", fr: "pourquoi" },
      { ja: "病気", reading: "びょうき", fr: "malade, maladie" },
    ],
    kanji: ["食", "午", "行", "来", "毎"],
    keyPoints: [
      "Parce que : raison + [から]、conséquence.",
      "Faisons… ! : verbe sans ます + [ましょう].",
      "Et si on… ? : verbe sans ます + [ませんか] (une invitation, pas une négation).",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Comme il fait froid, je ferme la fenêtre.", answer: "寒いですから、窓を閉めます。", wrong: ["窓を閉めますから、寒いです。", "寒いですから、窓を開けます。"] },
        { fr: "Mangeons ensemble !", answer: "一緒に食べましょう。", wrong: ["一緒に食べませんでした。", "一緒に食べてもいいです。"] },
        { fr: "Et si on allait au café ?", answer: "喫茶店に行きませんか。", wrong: ["喫茶店に行きません。", "喫茶店に行ってください。"] },
        { fr: "Je ne bois pas d'alcool parce que je suis malade.", answer: "病気ですから、お酒を飲みません。", wrong: ["お酒を飲みませんから、病気です。", "病気ですから、お酒を飲みましょう。"] },
        { fr: "Et si on faisait une pause ?", answer: "休みませんか。", wrong: ["休みません。", "休みましたか。"] },
        { fr: "Allons-y, il est temps.", answer: "そろそろ行きましょう。", wrong: ["そろそろ行きました。", "そろそろ行きませんでした。"] },
        { fr: "Parce que je suis occupé·e.", answer: "忙しいですから。", wrong: ["忙しいですか。", "忙しくないです。"] },
        { fr: "Et si on regardait un film ce soir ?", answer: "今晩、映画を見ませんか。", wrong: ["今晩、映画を見ません。", "今晩、映画を見ましたか。"] },
      ],
    },
    goal: 6,
    writing: {
      goal: 4,
      questions: [
        { fr: "Mangeons !", answers: ["食べましょう。", "たべましょう。"] },
        { fr: "Et si on y allait ?", answers: ["行きませんか。", "いきませんか。"] },
        { fr: "Je suis occupé·e, donc je n'y vais pas.", answers: ["忙しいですから、行きません。", "いそがしいですから、いきません。"] },
        { fr: "Rentrons.", answers: ["帰りましょう。", "かえりましょう。"] },
        { fr: "Et si on buvait un thé ?", answers: ["お茶を飲みませんか。", "おちゃをのみませんか。"] },
        { fr: "Comme il pleut, je reste à la maison.", answers: ["雨ですから、家にいます。", "あめですから、いえにいます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-mashou", label: "Plus de phrases avec ～ましょう" },
  },
  {
    id: "n5-bilan",
    number: 7,
    title: "Bilan N5 : un dimanche au parc",
    minutes: 10,
    summary: "Un petit récit qui réutilise tout le cours N5, avec des questions de compréhension.",
    sections: [
      {
        title: "Tu sais déjà lire ça",
        paragraphs: [
          "Ce récit utilise ce que tu as vu : あります / います, ～ている, いちばん, から et ～ませんか. Touche un mot pour voir son sens, écoute le texte, puis réponds aux questions.",
        ],
      },
    ],
    kanji: ["日", "木", "子", "天", "気"],
    keyPoints: [
      "Tu sais situer, décrire ce qui se passe, comparer, donner une raison et proposer.",
      "La suite : le palier N5 pour vérifier ton niveau, puis le cours N4.",
    ],
    exercise: {
      kind: "reading",
      text: "日曜日の朝、友達から電話がありました。「天気がいいですから、一緒に公園に行きませんか。」公園は駅の前にあります。公園には子どもがたくさんいました。私たちはいちばん大きい木の下でお弁当を食べました。友達は今、写真の勉強をしていますから、写真をたくさん撮りました。とても楽しかったです。",
      translation:
        "Dimanche matin, une amie m'a téléphoné : « Il fait beau, et si on allait au parc ensemble ? » Le parc est devant la gare. Dans le parc, il y avait beaucoup d'enfants. Nous avons mangé nos bentos sous le plus grand arbre. Comme mon amie étudie la photo en ce moment, elle a pris beaucoup de photos. C'était très agréable.",
      questions: [
        { fr: "Quand l'amie a-t-elle téléphoné ?", answer: "Dimanche matin", wrong: ["Samedi soir", "Lundi matin", "Dimanche soir"] },
        { fr: "Pourquoi propose-t-elle d'aller au parc ?", answer: "Parce qu'il fait beau", wrong: ["Parce qu'il pleut", "Pour travailler", "Pour voir un film"] },
        { fr: "Où se trouve le parc ?", answer: "Devant la gare", wrong: ["Derrière la gare", "Dans la gare", "Loin de la gare"] },
        { fr: "Où ont-elles mangé ?", answer: "Sous le plus grand arbre", wrong: ["Dans un restaurant", "À la gare", "Chez l'amie"] },
        { fr: "Pourquoi l'amie a-t-elle pris beaucoup de photos ?", answer: "Elle étudie la photo.", wrong: ["Elle est journaliste.", "Elle aime les enfants.", "Elle a un nouveau téléphone."] },
      ],
    },
    goal: 4,
  },
];
