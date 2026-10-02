import type { Lesson } from "@/lib/course/lessons";

// Cours N4 : la suite du parcours débutant, un point de grammaire N4 par
// leçon (ceux de src/lib/grammar/points.ts), du vocabulaire N4 et un QCM
// écrit à la main (aucun appel à Claude). Les pièges sont les erreurs
// typiques : une autre forme N4 au sens voisin, ou une conjugaison fautive.
// Vérifié par courses.test.ts (vocabulaire N4/N5, romaji, orthographe).
export const N4_LESSONS: Lesson[] = [
  {
    id: "n4-experiences",
    number: 1,
    title: "Raconter ses expériences : ～たことがある",
    minutes: 10,
    summary: "Dire ce qu'on a déjà fait (ou jamais fait), et faire deux choses à la fois avec ～ながら.",
    sections: [
      {
        title: "« J'ai déjà… » : ～たことがあります",
        paragraphs: [
          "Pour parler d'une expérience, on prend la forme en た du verbe (le passé familier : 行く → 行った, 食べる → 食べた, 見る → 見た), puis on ajoute ことがあります.",
          "Au négatif, ことがありません veut dire « je n'ai jamais… ». Avec か à la fin, c'est la question « As-tu déjà… ? ».",
        ],
        examples: [
          { ja: "富士山に登ったことがあります。", reading: "ふじさんにのぼったことがあります。", romaji: "Fujisan ni nobotta koto ga arimasu.", fr: "J'ai déjà gravi le mont Fuji." },
          { ja: "寿司を食べたことがありません。", reading: "すしをたべたことがありません。", romaji: "Sushi o tabeta koto ga arimasen.", fr: "Je n'ai jamais mangé de sushis." },
          { ja: "日本に行ったことがありますか。", reading: "にほんにいったことがありますか。", romaji: "Nihon ni itta koto ga arimasu ka.", fr: "Es-tu déjà allé(e) au Japon ?" },
        ],
      },
      {
        title: "Deux actions en même temps : ～ながら",
        paragraphs: [
          "Forme en ます sans ます, puis ながら : 聞きます → 聞きながら. L'action secondaire vient avec ながら, l'action principale se place à la fin de la phrase.",
        ],
        examples: [
          { ja: "音楽を聞きながら勉強します。", reading: "おんがくをききながらべんきょうします。", romaji: "Ongaku o kikinagara benkyou shimasu.", fr: "J'étudie en écoutant de la musique." },
          { ja: "歩きながら話しましょう。", reading: "あるきながらはなしましょう。", romaji: "Arukinagara hanashimashou.", fr: "Parlons en marchant." },
        ],
      },
    ],
    vocabulary: [
      { ja: "旅館", reading: "りょかん", fr: "auberge japonaise" },
      { ja: "神社", reading: "じんじゃ", fr: "sanctuaire shinto" },
      { ja: "漫画", reading: "まんが", fr: "manga" },
      { ja: "試合", reading: "しあい", fr: "match" },
      { ja: "趣味", reading: "しゅみ", fr: "passe-temps" },
      { ja: "泊まる", reading: "とまる", fr: "loger, dormir (à l'hôtel)" },
    ],
    keyPoints: [
      "Expérience : forme en た + ことがあります (行ったことがあります).",
      "Jamais : forme en た + ことがありません.",
      "En même temps : ます sans ます + ながら, l'action principale à la fin.",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "J'ai déjà vu ce film.", answer: "この映画を見たことがあります。", wrong: ["この映画を見たことがありません。", "この映画を見ることがあります。"] },
        { fr: "Je n'ai jamais dormi dans un ryokan.", answer: "旅館に泊まったことがありません。", wrong: ["旅館に泊まったことがあります。", "旅館に泊まることがありません。"] },
        { fr: "As-tu déjà lu ce manga ?", answer: "この漫画を読んだことがありますか。", wrong: ["この漫画を読んだことがあります。", "この漫画を読むことがありますか。"] },
        { fr: "J'étudie en écoutant de la musique.", answer: "音楽を聞きながら勉強します。", wrong: ["勉強しながら音楽を聞きます。", "音楽を聞いたことがあります。"] },
        { fr: "Je mange en regardant la télévision.", answer: "テレビを見ながら食べます。", wrong: ["食べながらテレビを見ます。", "テレビを見たことがあります。"] },
        { fr: "Je suis déjà allé(e) dans un sanctuaire à Kyoto.", answer: "京都の神社に行ったことがあります。", wrong: ["京都の神社に行くことがあります。", "京都の神社に行ったことがありません。"] },
        { fr: "Parlons en marchant.", answer: "歩きながら話しましょう。", wrong: ["歩いたことがあります。", "歩きながら話しました。"] },
        { fr: "Je n'ai jamais vu de match de judo.", answer: "柔道の試合を見たことがありません。", wrong: ["柔道の試合を見たことがあります。", "柔道の試合を見ることがありません。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-koto-ga-aru", label: "Plus de phrases avec ～たことがある" },
    goal: 6,
  },
  {
    id: "n4-avis",
    number: 2,
    title: "Donner son avis : ～と思う et ～そう",
    minutes: 10,
    summary: "Dire ce qu'on pense, et décrire ce qui a l'air d'être (« ça a l'air bon »).",
    sections: [
      {
        title: "« Je pense que… » : ～と思います",
        paragraphs: [
          "On met la phrase à la forme familière, puis と思います : 降る → 降ると思います. Au négatif : 来ない → 来ないと思います.",
          "Avec un nom ou un adjectif en な, on ajoute だ avant と : 静かだと思います. Avec un adjectif en い, jamais de だ : 難しいと思います.",
        ],
        examples: [
          { ja: "明日は雨が降ると思います。", reading: "あしたはあめがふるとおもいます。", romaji: "Ashita wa ame ga furu to omoimasu.", fr: "Je pense qu'il va pleuvoir demain." },
          { ja: "彼は来ないと思います。", reading: "かれはこないとおもいます。", romaji: "Kare wa konai to omoimasu.", fr: "Je pense qu'il ne viendra pas." },
          { ja: "日本語は難しいと思います。", reading: "にほんごはむずかしいとおもいます。", romaji: "Nihongo wa muzukashii to omoimasu.", fr: "Je trouve que le japonais est difficile." },
        ],
      },
      {
        title: "« Ça a l'air… » : ～そうです",
        paragraphs: [
          "Pour dire ce qu'on voit (l'apparence) : adjectif en い sans い + そう (おいしい → おいしそう), adjectif en な + そう (静か → 静かそう), verbe en ます sans ます + そう (降ります → 降りそう).",
          "Exception : いい devient よさそう. Attention, おいしいそうです (avec い) veut dire « j'ai entendu dire que c'est bon » : c'est une autre forme.",
        ],
        examples: [
          { ja: "このケーキはおいしそうです。", reading: "このケーキはおいしそうです。", romaji: "Kono keeki wa oishisou desu.", fr: "Ce gâteau a l'air bon." },
          { ja: "今にも雨が降りそうです。", reading: "いまにもあめがふりそうです。", romaji: "Ima ni mo ame ga furisou desu.", fr: "On dirait qu'il va pleuvoir d'un instant à l'autre." },
          { ja: "彼女は嬉しそうです。", reading: "かのじょはうれしそうです。", romaji: "Kanojo wa ureshisou desu.", fr: "Elle a l'air contente." },
        ],
      },
    ],
    vocabulary: [
      { ja: "彼", reading: "かれ", fr: "il, lui" },
      { ja: "彼女", reading: "かのじょ", fr: "elle, petite amie" },
      { ja: "嬉しい", reading: "うれしい", fr: "content" },
      { ja: "悲しい", reading: "かなしい", fr: "triste" },
      { ja: "優しい", reading: "やさしい", fr: "gentil" },
      { ja: "怖い", reading: "こわい", fr: "effrayant" },
    ],
    keyPoints: [
      "Avis : phrase familière + と思います (静かだと思います, 難しいと思います).",
      "Apparence : adjectif sans い, ou verbe sans ます, + そう (おいしそう, 降りそう).",
      "いい → よさそう ; おいしいそう (avec い) veut dire « on m'a dit que c'est bon ».",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Je pense qu'il va neiger demain.", answer: "明日は雪が降ると思います。", wrong: ["明日は雪が降りそうです。", "明日は雪が降ったと思います。"] },
        { fr: "Elle a l'air triste.", answer: "彼女は悲しそうです。", wrong: ["彼女は悲しいと思います。", "彼女は悲しいそうです。"] },
        { fr: "Ce professeur a l'air gentil.", answer: "あの先生は優しそうです。", wrong: ["あの先生は優しいそうです。", "あの先生は優しかったです。"] },
        { fr: "Je pense que ce film est intéressant.", answer: "この映画はおもしろいと思います。", wrong: ["この映画はおもしろそうです。", "この映画はおもしろいだと思います。"] },
        { fr: "Je pense que cette ville est calme.", answer: "この町は静かだと思います。", wrong: ["この町は静かと思います。", "この町は静かそうです。"] },
        { fr: "Il a l'air content.", answer: "彼は嬉しそうです。", wrong: ["彼は嬉しいと思います。", "彼は嬉しくそうです。"] },
        { fr: "Ce ramen a l'air bon.", answer: "このラーメンはおいしそうです。", wrong: ["このラーメンはおいしいそうです。", "このラーメンはおいしかったと思います。"] },
        { fr: "Je pense qu'il ne viendra pas.", answer: "彼は来ないと思います。", wrong: ["彼は来ると思います。", "彼は来なさそうと思います。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-to-omou", label: "Plus de phrases avec ～と思う" },
    goal: 6,
  },
  {
    id: "n4-devoir-pouvoir",
    number: 3,
    title: "Devoir et pouvoir : ～なければならない, ～ことができる",
    minutes: 10,
    summary: "Exprimer une obligation (« je dois ») et une capacité (« je sais, je peux »).",
    sections: [
      {
        title: "« Je dois… » : ～なければなりません",
        paragraphs: [
          "On part de la forme en ない, on retire le い final et on ajoute ければなりません : 行かない → 行かなければなりません, する → しなければなりません.",
          "À l'oral, on entend souvent la forme courte なきゃ : 行かなきゃ ! (« il faut que j'y aille ! »).",
        ],
        examples: [
          { ja: "明日までに宿題をしなければなりません。", reading: "あしたまでにしゅくだいをしなければなりません。", romaji: "Ashita made ni shukudai o shinakereba narimasen.", fr: "Je dois faire mes devoirs pour demain." },
          { ja: "薬を飲まなければならない。", reading: "くすりをのまなければならない。", romaji: "Kusuri o nomanakereba naranai.", fr: "Je dois prendre mon médicament." },
        ],
      },
      {
        title: "« Je peux, je sais… » : ～ことができます",
        paragraphs: [
          "Forme du dictionnaire + ことができます : 話す → 話すことができます. Au négatif : ことができません (« je ne peux pas, c'est interdit »).",
        ],
        examples: [
          { ja: "日本語を話すことができます。", reading: "にほんごをはなすことができます。", romaji: "Nihongo o hanasu koto ga dekimasu.", fr: "Je sais parler japonais." },
          { ja: "ここでは泳ぐことができません。", reading: "ここではおよぐことができません。", romaji: "Koko de wa oyogu koto ga dekimasen.", fr: "On ne peut pas nager ici." },
        ],
      },
    ],
    vocabulary: [
      { ja: "規則", reading: "きそく", fr: "règle" },
      { ja: "準備", reading: "じゅんび", fr: "préparation" },
      { ja: "予約", reading: "よやく", fr: "réservation" },
      { ja: "払う", reading: "はらう", fr: "payer" },
      { ja: "急ぐ", reading: "いそぐ", fr: "se dépêcher" },
      { ja: "注意", reading: "ちゅうい", fr: "attention" },
    ],
    keyPoints: [
      "Obligation : forme en ない sans い + ければなりません (行かなければなりません).",
      "Capacité ou permission : dictionnaire + ことができます (話すことができます).",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Je dois partir tôt demain.", answer: "明日は早く出かけなければなりません。", wrong: ["明日は早く出かけることができます。", "明日は早く出かけなくてもいいです。"] },
        { fr: "Il faut payer ici.", answer: "ここで払わなければなりません。", wrong: ["ここで払うことができます。", "ここで払わないでください。"] },
        { fr: "Je sais nager.", answer: "泳ぐことができます。", wrong: ["泳がなければなりません。", "泳いだことがあります。"] },
        { fr: "On ne peut pas prendre de photos ici.", answer: "ここで写真を撮ることができません。", wrong: ["ここで写真を撮らなければなりません。", "ここで写真を撮ったことがありません。"] },
        { fr: "Je dois réserver l'hôtel.", answer: "ホテルを予約しなければなりません。", wrong: ["ホテルを予約することができます。", "ホテルを予約したことがあります。"] },
        { fr: "Il faut se dépêcher !", answer: "急がなければなりません。", wrong: ["急ぐことができます。", "急いだことがあります。"] },
        { fr: "Peux-tu lire les kanji ?", answer: "漢字を読むことができますか。", wrong: ["漢字を読まなければなりませんか。", "漢字を読んだことがありますか。"] },
        { fr: "Je dois respecter les règles.", answer: "規則を守らなければなりません。", wrong: ["規則を守ることができません。", "規則を守ったことがあります。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-nakereba-naranai", label: "Plus de phrases avec ～なければならない" },
    goal: 6,
  },
  {
    id: "n4-conditions",
    number: 4,
    title: "Les conditions : ～たら, ～ば, ～ても",
    minutes: 12,
    summary: "« Si », « quand » et « même si » : les trois façons de poser une condition.",
    sections: [
      {
        title: "« Si, quand… » : ～たら",
        paragraphs: [
          "Forme en た + ら : 着いた → 着いたら, あった → あったら. C'est la condition la plus courante à l'oral : « si… » ou « une fois que… ».",
        ],
        examples: [
          { ja: "家に着いたら、電話します。", reading: "いえについたら、でんわします。", romaji: "Ie ni tsuitara, denwa shimasu.", fr: "Je t'appellerai quand je serai arrivé(e) chez moi." },
          { ja: "時間があったら、遊びに来てください。", reading: "じかんがあったら、あそびにきてください。", romaji: "Jikan ga attara, asobi ni kite kudasai.", fr: "Si tu as le temps, viens me voir." },
        ],
      },
      {
        title: "« Si… » : ～ば",
        paragraphs: [
          "Verbes : la dernière syllabe passe en -e, puis ば (行く → 行けば, 急ぐ → 急げば, 食べる → 食べれば). Adjectifs en い : い devient ければ (安い → 安ければ).",
          "ば insiste sur la condition elle-même : « si (et seulement si)… ».",
        ],
        examples: [
          { ja: "安ければ、買います。", reading: "やすければ、かいます。", romaji: "Yasukereba, kaimasu.", fr: "Si c'est bon marché, je l'achète." },
          { ja: "急げば、間に合います。", reading: "いそげば、まにあいます。", romaji: "Isogeba, maniaimasu.", fr: "Si tu te dépêches, tu seras à l'heure." },
        ],
      },
      {
        title: "« Même si… » : ～ても",
        paragraphs: ["Forme en て + も : 降って → 降っても, 高くて → 高くても. La suite se produit malgré la condition."],
        examples: [
          { ja: "雨が降っても、行きます。", reading: "あめがふっても、いきます。", romaji: "Ame ga futte mo, ikimasu.", fr: "Même s'il pleut, j'y vais." },
          { ja: "高くても、買いたいです。", reading: "たかくても、かいたいです。", romaji: "Takakute mo, kaitai desu.", fr: "Même si c'est cher, je veux l'acheter." },
        ],
      },
    ],
    vocabulary: [
      { ja: "台風", reading: "たいふう", fr: "typhon" },
      { ja: "熱", reading: "ねつ", fr: "fièvre" },
      { ja: "将来", reading: "しょうらい", fr: "avenir" },
      { ja: "都合", reading: "つごう", fr: "disponibilité" },
      { ja: "間に合う", reading: "まにあう", fr: "être à l'heure" },
      { ja: "決める", reading: "きめる", fr: "décider" },
    ],
    keyPoints: [
      "たら : forme en た + ら, « si » ou « une fois que » (着いたら).",
      "ば : syllabe en -e + ば, adjectifs い → ければ (行けば, 安ければ).",
      "ても : forme en て + も, « même si » (降っても).",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "S'il fait beau, allons au parc.", answer: "天気がよかったら、公園に行きましょう。", wrong: ["天気がよくても、公園に行きましょう。", "天気がいいながら、公園に行きましょう。"] },
        { fr: "Même s'il y a un typhon, le match a lieu.", answer: "台風が来ても、試合はあります。", wrong: ["台風が来たら、試合はあります。", "台風が来れば、試合はあります。"] },
        { fr: "Si c'est bon marché, je l'achète.", answer: "安ければ、買います。", wrong: ["安くても、買います。", "安いければ、買います。"] },
        { fr: "Même si j'ai de la fièvre, je vais au travail.", answer: "熱があっても、会社に行きます。", wrong: ["熱があったら、会社に行きます。", "熱があれば、会社に行きます。"] },
        { fr: "Quand je serai rentré(e), je t'enverrai un message.", answer: "家に帰ったら、メッセージを送ります。", wrong: ["家に帰っても、メッセージを送ります。", "家に帰りながら、メッセージを送ります。"] },
        { fr: "Si tu te dépêches, tu seras à l'heure.", answer: "急げば、間に合います。", wrong: ["急いでも、間に合います。", "急ぐば、間に合います。"] },
        { fr: "Même si c'est difficile, je n'abandonne pas.", answer: "難しくても、あきらめません。", wrong: ["難しければ、あきらめません。", "難しかったら、あきらめません。"] },
        { fr: "Si tu as le temps, viens me voir.", answer: "時間があったら、遊びに来てください。", wrong: ["時間があっても、遊びに来てください。", "時間がありながら、遊びに来てください。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-tara", label: "Plus de phrases avec ～たら" },
    goal: 6,
  },
  {
    id: "n4-habitudes",
    number: 5,
    title: "Habitudes et préparatifs : ～ておく, ～ようにする, ～すぎる",
    minutes: 12,
    summary: "Faire quelque chose à l'avance, prendre une bonne habitude, et dire « trop ».",
    sections: [
      {
        title: "« À l'avance » : ～ておく",
        paragraphs: ["Forme en て + おく : 予約して → 予約しておきます. On prépare quelque chose pour plus tard, ou on laisse une chose dans un état."],
        examples: [
          { ja: "ホテルを予約しておきます。", reading: "ホテルをよやくしておきます。", romaji: "Hoteru o yoyaku shite okimasu.", fr: "Je réserve l'hôtel à l'avance." },
          { ja: "窓を開けておいてください。", reading: "まどをあけておいてください。", romaji: "Mado o akete oite kudasai.", fr: "Laisse la fenêtre ouverte, s'il te plaît." },
        ],
      },
      {
        title: "« Faire en sorte de… » : ～ようにしています",
        paragraphs: [
          "Forme du dictionnaire (ou en ない) + ようにしています : un effort régulier, une habitude qu'on s'impose. Au négatif : 食べないようにしています, « j'évite de manger ».",
        ],
        examples: [
          { ja: "毎日運動するようにしています。", reading: "まいにちうんどうするようにしています。", romaji: "Mainichi undou suru you ni shite imasu.", fr: "Je m'efforce de faire du sport tous les jours." },
          { ja: "夜は甘いものを食べないようにしています。", reading: "よるはあまいものをたべないようにしています。", romaji: "Yoru wa amai mono o tabenai you ni shite imasu.", fr: "Le soir, j'évite de manger sucré." },
        ],
      },
      {
        title: "« Trop » : ～すぎる",
        paragraphs: [
          "Verbe en ます sans ます, ou adjectif sans い (sans な), + すぎる : 食べます → 食べすぎる, 難しい → 難しすぎる. Jamais 難しいすぎる.",
        ],
        examples: [
          { ja: "食べすぎました。", reading: "たべすぎました。", romaji: "Tabesugimashita.", fr: "J'ai trop mangé." },
          { ja: "この問題は難しすぎます。", reading: "このもんだいはむずかしすぎます。", romaji: "Kono mondai wa muzukashisugimasu.", fr: "Ce problème est trop difficile." },
        ],
      },
    ],
    vocabulary: [
      { ja: "習慣", reading: "しゅうかん", fr: "habitude" },
      { ja: "生活", reading: "せいかつ", fr: "vie quotidienne" },
      { ja: "道具", reading: "どうぐ", fr: "outil" },
      { ja: "集める", reading: "あつめる", fr: "rassembler" },
      { ja: "捨てる", reading: "すてる", fr: "jeter" },
      { ja: "慣れる", reading: "なれる", fr: "s'habituer" },
    ],
    keyPoints: [
      "À l'avance : forme en て + おく (予約しておきます).",
      "Habitude : dictionnaire ou forme en ない + ようにしています.",
      "Trop : ます sans ます ou adjectif sans い + すぎる (難しすぎる, jamais 難しいすぎる).",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "J'ai trop bu.", answer: "飲みすぎました。", wrong: ["飲んでおきました。", "飲むようにしました。"] },
        { fr: "Je prépare les outils à l'avance.", answer: "道具を準備しておきます。", wrong: ["道具を準備しすぎました。", "道具を準備したことがあります。"] },
        { fr: "Je fais en sorte de me coucher tôt.", answer: "早く寝るようにしています。", wrong: ["早く寝すぎています。", "早く寝ておきます。"] },
        { fr: "Ce sac est trop cher.", answer: "このかばんは高すぎます。", wrong: ["このかばんは高いすぎます。", "このかばんは高くておきます。"] },
        { fr: "J'évite de manger de la viande.", answer: "肉を食べないようにしています。", wrong: ["肉を食べすぎています。", "肉を食べるようにしています。"] },
        { fr: "J'apprends les mots avant le cours.", answer: "授業の前に、言葉を覚えておきます。", wrong: ["授業の前に、言葉を覚えすぎます。", "授業の前に、言葉を覚えたことがあります。"] },
        { fr: "Cette chambre est trop petite.", answer: "この部屋は小さすぎます。", wrong: ["この部屋は小さいすぎます。", "この部屋は小さくすぎます。"] },
        { fr: "Je fais en sorte de parler japonais tous les jours.", answer: "毎日日本語を話すようにしています。", wrong: ["毎日日本語を話しすぎています。", "毎日日本語を話しておきます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-sugiru", label: "Plus de phrases avec ～すぎる" },
    goal: 6,
  },
  {
    id: "n4-bilan",
    number: 6,
    title: "Bilan N4 : un voyage à Kyoto",
    minutes: 10,
    summary: "Un petit récit qui réutilise tout le cours N4, avec des questions de compréhension.",
    sections: [
      {
        title: "Tu sais déjà lire ça",
        paragraphs: [
          "Ce récit utilise ce que tu as vu : l'expérience (たことがある), ながら, ても, すぎる et と思う. Touche un mot pour voir son sens, écoute le texte, puis réponds aux questions.",
        ],
      },
    ],
    keyPoints: [
      "Tu sais raconter une expérience, donner ton avis, poser une condition et dire « trop ».",
      "La suite : le palier N4 pour vérifier ton niveau, et de vrais textes dans l'analyse.",
    ],
    exercise: {
      kind: "reading",
      text: "先週、友達と京都に行きました。京都に行ったことがなかったので、とても楽しみでした。雨が降っても、お寺を見に行きたかったです。歩きながら、写真をたくさん撮りました。夜は旅館に泊まりました。料理がおいしすぎて、食べすぎました。来年は大阪にも行きたいと思います。",
      translation:
        "La semaine dernière, je suis allée à Kyoto avec une amie. Comme je n'étais jamais allée à Kyoto, j'avais vraiment hâte. Même s'il pleuvait, je voulais aller voir les temples. En marchant, j'ai pris beaucoup de photos. Le soir, nous avons dormi dans un ryokan. La cuisine était tellement bonne que j'ai trop mangé. L'année prochaine, je pense aller aussi à Osaka.",
      questions: [
        { fr: "Où est-elle allée la semaine dernière ?", answer: "À Kyoto", wrong: ["À Osaka", "À Tokyo", "À Nara"] },
        { fr: "Était-elle déjà allée à Kyoto ?", answer: "Non, jamais", wrong: ["Oui, une fois", "Oui, souvent", "Elle y habite"] },
        { fr: "Qu'a-t-elle fait en marchant ?", answer: "Elle a pris des photos.", wrong: ["Elle a mangé.", "Elle a écouté de la musique.", "Elle a téléphoné."] },
        { fr: "Où a-t-elle dormi ?", answer: "Dans un ryokan", wrong: ["À l'hôtel", "Chez une amie", "Dans un temple"] },
        { fr: "Que pense-t-elle faire l'année prochaine ?", answer: "Aller à Osaka", wrong: ["Retourner à Kyoto", "Rester chez elle", "Apprendre le coréen"] },
      ],
    },
    goal: 4,
  },
];
