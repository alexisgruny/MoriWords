import type { Lesson } from "@/lib/course/lessons";

// Cours N4, partie 3 « Relier les idées » : conditions, moments, raisons
// et contrastes, buts et changements.
export const N4_LIENS_LESSONS: Omit<Lesson, "number">[] = [
  {
    id: "n4-conditions",
    title: "Les conditions : ～たら, ～ば, ～ても, ～と",
    minutes: 18,
    summary: "« Si », « quand », « même si » et « à chaque fois que » : les quatre façons de poser une condition.",
    sections: [
      {
        title: "« Si, quand… » : ～たら",
        formula: "Verbe en た + [ら]　（adjectif : 高かった[ら]、nom : 雨だった[ら]）",
        paragraphs: [
          "Forme en た + [ら] : 着いた → 着いた[ら], あった → あった[ら]. C'est la condition la plus courante à l'oral : « si… » ou « une fois que… ».",
        ],
        examples: [
          { ja: "家に着いた[ら]、電話します。", reading: "いえについた[ら]、でんわします。", romaji: "Ie ni tsuita[ra], denwa shimasu.", fr: "Je t'appellerai quand je serai arrivé·e chez moi." },
          { ja: "時間があった[ら]、遊びに来てください。", reading: "じかんがあった[ら]、あそびにきてください。", romaji: "Jikan ga atta[ra], asobi ni kite kudasai.", fr: "Si tu as le temps, viens me voir." },
        ],
        tip: "たら peut vouloir dire « une fois que » : 家に着いたら = « quand je serai arrivé·e », pas forcément « si ».",
      },
      {
        title: "« Si… » : ～ば",
        formula: "Verbe : son en e + [ば]　／　adjectif en い : い → [ければ]",
        paragraphs: [
          "Verbes : la dernière syllabe passe en -e, puis [ば] (行く → 行け[ば], 急ぐ → 急げ[ば], 食べる → 食べれ[ば]). Adjectifs en い : い devient [ければ] (安い → 安[ければ]).",
          "ば insiste sur la condition elle-même : « si (et seulement si)… ».",
        ],
        examples: [
          { ja: "安[ければ]、買います。", reading: "やす[ければ]、かいます。", romaji: "Yasu[kereba], kaimasu.", fr: "Si c'est bon marché, je l'achète." },
          { ja: "急げ[ば]、間に合います。", reading: "いそげ[ば]、まにあいます。", romaji: "Isoge[ba], maniaimasu.", fr: "Si tu te dépêches, tu seras à l'heure." },
        ],
        tip: "Pas de い devant ければ : 安[ければ], jamais 安いければ.",
      },
      {
        title: "« Même si… » : ～ても",
        formula: "Forme en て + [も]　（adjectif い : [くても]、nom : [でも]）",
        paragraphs: ["Forme en て + [も] : 降って → 降って[も], 高くて → 高く[ても]. La suite se produit **malgré** la condition."],
        examples: [
          { ja: "雨が降って[も]、行きます。", reading: "あめがふって[も]、いきます。", romaji: "Ame ga futte [mo], ikimasu.", fr: "Même s'il pleut, j'y vais." },
          { ja: "高く[ても]、買いたいです。", reading: "たかく[ても]、かいたいです。", romaji: "Takaku[te mo], kaitai desu.", fr: "Même si c'est cher, je veux l'acheter." },
        ],
      },
      {
        title: "« À chaque fois que » : ～と",
        formula: "Dictionnaire + [と] + conséquence naturelle",
        paragraphs: [
          "[と] après la forme du dictionnaire : la conséquence arrive **automatiquement**, à chaque fois : 春になる[と]、花が咲きます. Utile pour les machines, les chemins, les lois de la nature.",
          "Mais pas de demande ni d'intention après と : 駅に着くと、電話してください est faux, il faut ～たら.",
        ],
        examples: [
          { ja: "このボタンを押す[と]、切符が出ます。", reading: "このボタンをおす[と]、きっぷがでます。", romaji: "Kono botan o osu [to], kippu ga demasu.", fr: "Quand on appuie sur ce bouton, le billet sort." },
          { ja: "信号が赤になる[と]、車が止まります。", reading: "しんごうがあかになる[と]、くるまがとまります。", romaji: "Shingou ga aka ni naru [to], kuruma ga tomarimasu.", fr: "Quand le feu passe au rouge, les voitures s'arrêtent." },
          { ja: "この道をまっすぐ行く[と]、駅があります。", reading: "このみちをまっすぐいく[と]、えきがあります。", romaji: "Kono michi o massugu iku [to], eki ga arimasu.", fr: "En allant tout droit dans cette rue, vous trouverez la gare." },
        ],
        tip: "En cas de doute, [たら] marche presque partout ; と ne s'emploie pas devant une demande ou une intention.",
      },
    ],
    vocabulary: [
      { ja: "台風", reading: "たいふう", fr: "typhon" },
      { ja: "熱", reading: "ねつ", fr: "fièvre" },
      { ja: "将来", reading: "しょうらい", fr: "avenir" },
      { ja: "都合", reading: "つごう", fr: "disponibilité" },
      { ja: "間に合う", reading: "まにあう", fr: "être à l'heure" },
      { ja: "決める", reading: "きめる", fr: "décider" },
      { ja: "空", reading: "そら", fr: "ciel" },
      { ja: "近い", reading: "ちかい", fr: "proche" },
    ],
    kanji: ["台", "安", "悪", "空", "色", "赤", "近", "通", "道", "重", "青", "風", "黒"],
    keyPoints: [
      "たら : forme en た + [ら], « si » ou « une fois que » (着いたら).",
      "ば : son en e + [ば] ; adjectif い → [ければ] (行けば, 安ければ).",
      "ても : forme en て + [も], « même si » (降っても).",
      "と : dictionnaire + [と], conséquence automatique ; jamais devant une demande.",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "S'il fait beau, allons au parc.", answer: "天気がよかったら、公園に行きましょう。", wrong: ["天気がよくても、公園に行きましょう。", "天気がいいながら、公園に行きましょう。"] },
        { fr: "Même s'il y a un typhon, le match a lieu.", answer: "台風が来ても、試合はあります。", wrong: ["台風が来たら、試合はあります。", "台風が来れば、試合はあります。"] },
        { fr: "Si c'est bon marché, je l'achète.", answer: "安ければ、買います。", wrong: ["安くても、買います。", "安いければ、買います。"] },
        { fr: "Même si j'ai de la fièvre, je vais au travail.", answer: "熱があっても、会社に行きます。", wrong: ["熱があったら、会社に行きます。", "熱があれば、会社に行きます。"] },
        { fr: "Quand je serai rentré·e, je t'enverrai un message.", answer: "家に帰ったら、メッセージを送ります。", wrong: ["家に帰っても、メッセージを送ります。", "家に帰りながら、メッセージを送ります。"] },
        { fr: "Si tu te dépêches, tu seras à l'heure.", answer: "急げば、間に合います。", wrong: ["急いでも、間に合います。", "急ぐば、間に合います。"] },
        { fr: "Même si c'est difficile, je n'abandonne pas.", answer: "難しくても、あきらめません。", wrong: ["難しければ、あきらめません。", "難しかったら、あきらめません。"] },
        { fr: "Si tu as le temps, viens me voir.", answer: "時間があったら、遊びに来てください。", wrong: ["時間があっても、遊びに来てください。", "時間がありながら、遊びに来てください。"] },
        { fr: "Quand on appuie sur ce bouton, le billet sort.", answer: "このボタンを押すと、切符が出ます。", wrong: ["このボタンを押しても、切符が出ます。", "このボタンを押したと、切符が出ます。"] },
        { fr: "Quand le feu passe au rouge, on s'arrête.", answer: "信号が赤になると、止まります。", wrong: ["信号が赤になっても、止まります。", "信号が赤になるば、止まります。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Si tu as le temps, viens.", answers: ["時間があったら、来てください。", "じかんがあったら、きてください。"] },
        { fr: "Même s'il pleut, j'y vais.", answers: ["雨が降っても、行きます。", "あめがふっても、いきます。"] },
        { fr: "Si c'est bon marché, je l'achète.", answers: ["安ければ、買います。", "やすければ、かいます。", "安かったら、買います。", "やすかったら、かいます。"] },
        { fr: "Quand je serai arrivé·e, je t'appelle.", answers: ["着いたら、電話します。", "ついたら、でんわします。"] },
        { fr: "Si tu te dépêches, tu seras à l'heure.", answers: ["急げば、間に合います。", "いそげば、まにあいます。", "急いだら、間に合います。", "いそいだら、まにあいます。"] },
        { fr: "Même si c'est cher, je l'achète.", answers: ["高くても、買います。", "たかくても、かいます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-tara", label: "Plus de phrases avec ～たら" },
  },
  {
    id: "n4-temps",
    title: "Le bon moment : とき, あいだ, ところ, たばかり",
    minutes: 15,
    summary: "Dire « quand », « pendant », « sur le point de » et « venir de ».",
    sections: [
      {
        title: "Quand : ～とき",
        formula: "Forme familière + [とき]　（nom + [のとき]、な + [なとき]）",
        paragraphs: [
          "[とき] = « quand, au moment où ». Devant, une forme familière : 暇[なとき], 子ども[のとき], 寒い[とき].",
          "Le temps du verbe devant とき compte : 日本に行く[とき] (avant d'y aller, pendant le trajet), 日本に行った[とき] (une fois là-bas).",
        ],
        examples: [
          { ja: "子ども[のとき]、よく川で泳ぎました。", reading: "こども[のとき]、よくかわでおよぎました。", romaji: "Kodomo [no toki], yoku kawa de oyogimashita.", fr: "Quand j'étais enfant, je nageais souvent dans la rivière." },
          { ja: "日本に行く[とき]、カメラを買いました。", reading: "にほんにいく[とき]、カメラをかいました。", romaji: "Nihon ni iku [toki], kamera o kaimashita.", fr: "Avant de partir au Japon, j'ai acheté un appareil photo." },
          { ja: "日本に行った[とき]、カメラを買いました。", reading: "にほんにいった[とき]、カメラをかいました。", romaji: "Nihon ni itta [toki], kamera o kaimashita.", fr: "Quand j'étais au Japon, j'y ai acheté un appareil photo." },
        ],
        tip: "行くとき = avant d'y être ; [行ったとき] = une fois arrivé·e.",
      },
      {
        title: "Pendant : あいだ et あいだに",
        formula: "～[間] (pendant tout le temps)　／　～[間に] (à un moment pendant)",
        paragraphs: [
          "[間] (あいだ) : une action qui dure **tout le temps** que dure l'autre : 夏休みの[間]、ずっと国にいました.",
          "[間に] (あいだに) : une action qui arrive **à un moment** de cette période : 母が寝ている[間に]、ケーキを作りました.",
        ],
        examples: [
          { ja: "夏休みの[間]、ずっと国にいました。", reading: "なつやすみの[あいだ]、ずっとくににいました。", romaji: "Natsuyasumi no [aida], zutto kuni ni imashita.", fr: "Pendant toutes les vacances d'été, je suis resté·e dans mon pays." },
          { ja: "母が寝ている[間に]、ケーキを作りました。", reading: "はははねている[あいだに]、ケーキをつくりました。", romaji: "Haha ga nete iru [aida ni], keeki o tsukurimashita.", fr: "Pendant que ma mère dormait, j'ai fait un gâteau." },
        ],
      },
      {
        title: "Sur le point de, en plein, à l'instant : ところ, たばかり",
        formula: "Dictionnaire + [ところ]　ている + [ところ]　た + [ところ]　／　た + [ばかり]",
        paragraphs: [
          "[ところです] situe dans le déroulement : 出かける[ところです] (je vais partir), 食べている[ところです] (je suis en plein repas), 帰った[ところです] (je viens tout juste de rentrer).",
          "[たばかり] : « venir de », selon le **ressenti** ; ça peut dater d'une semaine : 先週日本に来た[ばかり]です.",
        ],
        examples: [
          { ja: "今から出かける[ところです]。", reading: "いまからでかける[ところです]。", romaji: "Ima kara dekakeru [tokoro desu].", fr: "Je m'apprête à sortir." },
          { ja: "今、晩ご飯を食べている[ところです]。", reading: "いま、ばんごはんをたべている[ところです]。", romaji: "Ima, bangohan o tabete iru [tokoro desu].", fr: "Je suis en plein dîner." },
          { ja: "先週、日本に来た[ばかり]です。", reading: "せんしゅう、にほんにきた[ばかり]です。", romaji: "Senshuu, Nihon ni kita [bakari] desu.", fr: "Je viens d'arriver au Japon, la semaine dernière." },
        ],
        tip: "帰ったところ = il y a quelques secondes ; 帰った[ばかり] peut couvrir plusieurs jours.",
      },
    ],
    vocabulary: [
      { ja: "去年", reading: "きょねん", fr: "l'année dernière" },
      { ja: "朝", reading: "あさ", fr: "matin" },
      { ja: "昼", reading: "ひる", fr: "midi, journée" },
      { ja: "夕方", reading: "ゆうがた", fr: "fin d'après-midi" },
      { ja: "夜", reading: "よる", fr: "nuit, soir" },
      { ja: "待つ", reading: "まつ", fr: "attendre" },
      { ja: "帰る", reading: "かえる", fr: "rentrer" },
      { ja: "間", reading: "あいだ", fr: "intervalle, pendant" },
    ],
    kanji: ["去", "夕", "夜", "帰", "待", "昼", "曜", "朝"],
    keyPoints: [
      "Quand : forme familière + [とき] ; nom + [のとき], な + [なとき].",
      "Pendant tout le temps : [間] ; à un moment pendant : [間に].",
      "Sur le point : dictionnaire + [ところ] ; à l'instant : た + [ところ] ; récemment : た + [ばかり].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Quand j'étais enfant, j'aimais les chiens.", answer: "子どものとき、犬が好きでした。", wrong: ["子どもとき、犬が好きでした。", "子どもなとき、犬が好きでした。"] },
        { fr: "Quand je suis libre, je lis.", answer: "暇なとき、本を読みます。", wrong: ["暇のとき、本を読みます。", "暇だとき、本を読みます。"] },
        { fr: "Quand j'étais au Japon, j'ai mangé des ramen.", answer: "日本に行ったとき、ラーメンを食べました。", wrong: ["日本に行くとき、ラーメンを食べました。", "日本に行ってとき、ラーメンを食べました。"] },
        { fr: "Pendant toutes les vacances, je suis resté·e à la maison.", answer: "休みの間、ずっと家にいました。", wrong: ["休みの間に、ずっと家にいました。", "休み間、ずっと家にいました。"] },
        { fr: "Pendant que je dormais, un ami est venu.", answer: "寝ている間に、友達が来ました。", wrong: ["寝ている間、友達が来ました。", "寝る間に、友達が来ました。"] },
        { fr: "Je m'apprête à sortir.", answer: "今から出かけるところです。", wrong: ["今から出かけたところです。", "今から出かけているところです。"] },
        { fr: "Je viens tout juste de rentrer.", answer: "今、帰ったところです。", wrong: ["今、帰るところです。", "今、帰っているところです。"] },
        { fr: "Je suis en plein repas.", answer: "今、食べているところです。", wrong: ["今、食べるところです。", "今、食べたところです。"] },
        { fr: "Je viens d'arriver au Japon le mois dernier.", answer: "先月、日本に来たばかりです。", wrong: ["先月、日本に来るばかりです。", "先月、日本に来ているばかりです。"] },
        { fr: "Quand il fait froid, je bois du thé.", answer: "寒いとき、お茶を飲みます。", wrong: ["寒いのとき、お茶を飲みます。", "寒くとき、お茶を飲みます。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Quand j'étais enfant, je nageais.", answers: ["子どものとき、泳ぎました。", "こどものとき、およぎました。", "子供のとき、泳ぎました。"] },
        { fr: "Quand je suis libre, je lis.", answers: ["暇なとき、本を読みます。", "ひまなとき、ほんをよみます。"] },
        { fr: "Je viens de rentrer.", answers: ["帰ったところです。", "かえったところです。", "今、帰ったところです。", "いま、かえったところです。"] },
        { fr: "Je m'apprête à sortir.", answers: ["出かけるところです。", "でかけるところです。", "今から出かけるところです。", "いまからでかけるところです。"] },
        { fr: "Je viens d'arriver au Japon.", answers: ["日本に来たばかりです。", "にほんにきたばかりです。"] },
        { fr: "Pendant les vacances, je suis resté·e à la maison.", answers: ["休みの間、家にいました。", "やすみのあいだ、いえにいました。"] },
      ],
    },
  },
  {
    id: "n4-raisons",
    title: "Raisons et contrastes : ので, のに, ～し, けど",
    minutes: 15,
    summary: "Donner une raison avec douceur, exprimer une surprise (« alors que »), énumérer des raisons, dire « mais ».",
    sections: [
      {
        title: "Parce que, en douceur : ので",
        formula: "Forme familière + [ので]　（nom ou な + [なので]）",
        paragraphs: [
          "[ので] donne une raison comme から, mais de façon plus **douce** et plus objective : on l'utilise pour s'excuser ou demander poliment.",
          "Avec un nom ou un adjectif en な : [なので] (雨[なので], 静か[なので]).",
        ],
        examples: [
          { ja: "頭が痛い[ので]、早く帰ってもいいですか。", reading: "あたまがいたい[ので]、はやくかえってもいいですか。", romaji: "Atama ga itai [node], hayaku kaette mo ii desu ka.", fr: "J'ai mal à la tête : puis-je rentrer tôt ?" },
          { ja: "明日は休み[なので]、ゆっくり寝ます。", reading: "あしたはやすみ[なので]、ゆっくりねます。", romaji: "Ashita wa yasumi [na node], yukkuri nemasu.", fr: "Comme demain c'est congé, je vais faire la grasse matinée." },
        ],
        tip: "Pour donner un ordre ou un avis tranché, から va mieux ; pour s'excuser, [ので] est plus poli.",
      },
      {
        title: "Alors que : のに",
        formula: "Forme familière + [のに]　（nom ou な + [なのに]）",
        paragraphs: [
          "[のに] marque une **surprise** ou un **regret** : le résultat n'est pas celui qu'on attendait. 勉強した[のに]、試験に落ちました (alors que j'avais étudié, j'ai raté l'examen).",
        ],
        examples: [
          { ja: "約束した[のに]、彼は来ませんでした。", reading: "やくそくした[のに]、かれはきませんでした。", romaji: "Yakusoku shita [noni], kare wa kimasen deshita.", fr: "Alors qu'il avait promis, il n'est pas venu." },
          { ja: "日曜日[なのに]、仕事に行きます。", reading: "にちようび[なのに]、しごとにいきます。", romaji: "Nichiyoubi [na noni], shigoto ni ikimasu.", fr: "Bien que ce soit dimanche, je vais au travail." },
        ],
        tip: "Pas de demande après のに : pour « alors que…, fais ceci », on emploie ても ou けど.",
      },
      {
        title: "Plusieurs raisons : ～し / Mais : けど",
        formula: "Forme familière + [し]、… + [し]　／　phrase + [けど]、phrase",
        paragraphs: [
          "[～し] énumère **plusieurs raisons** (« et puis…, en plus… ») : この店は安い[し]、おいしい[し]、よく来ます.",
          "[けど] (plus poli : けれども) = « mais », comme が, en plus familier. Il sert aussi à adoucir une demande : ちょっと聞きたいんです[けど]…",
        ],
        examples: [
          { ja: "この町は静かだ[し]、駅も近い[し]、住みやすいです。", reading: "このまちはしずかだ[し]、えきもちかい[し]、すみやすいです。", romaji: "Kono machi wa shizuka da [shi], eki mo chikai [shi], sumiyasui desu.", fr: "Cette ville est calme, la gare est proche… il fait bon y vivre." },
          { ja: "高い[けど]、おいしいです。", reading: "たかい[けど]、おいしいです。", romaji: "Takai [kedo], oishii desu.", fr: "C'est cher, mais c'est bon." },
        ],
        tip: "Avec し, on met souvent [も] : 駅[も]近いし (la gare aussi est proche).",
      },
    ],
    vocabulary: [
      { ja: "約束", reading: "やくそく", fr: "promesse, rendez-vous" },
      { ja: "特に", reading: "とくに", fr: "particulièrement" },
      { ja: "別に", reading: "べつに", fr: "pas spécialement" },
      { ja: "不便", reading: "ふべん", fr: "peu pratique" },
      { ja: "元気", reading: "げんき", fr: "en forme" },
      { ja: "広い", reading: "ひろい", fr: "spacieux, large" },
      { ja: "少ない", reading: "すくない", fr: "peu nombreux" },
      { ja: "古い", reading: "ふるい", fr: "vieux, ancien" },
    ],
    kanji: ["不", "以", "元", "別", "古", "多", "少", "広", "特", "町"],
    keyPoints: [
      "Raison douce : forme familière + [ので] ; nom ou な + [なので].",
      "Alors que (surprise, regret) : + [のに] ; nom ou な + [なのに].",
      "Plusieurs raisons : ～[し]、～[し] ; mais : [けど].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Comme j'ai mal à la tête, puis-je rentrer ?", answer: "頭が痛いので、帰ってもいいですか。", wrong: ["頭が痛いなので、帰ってもいいですか。", "頭が痛いのに、帰ってもいいですか。"] },
        { fr: "Comme c'est congé demain, je dors longtemps.", answer: "明日は休みなので、ゆっくり寝ます。", wrong: ["明日は休みので、ゆっくり寝ます。", "明日は休みだので、ゆっくり寝ます。"] },
        { fr: "Alors que j'ai étudié, j'ai raté l'examen.", answer: "勉強したのに、試験に落ちました。", wrong: ["勉強したので、試験に落ちました。", "勉強したなのに、試験に落ちました。"] },
        { fr: "Bien que ce soit dimanche, je travaille.", answer: "日曜日なのに、働きます。", wrong: ["日曜日のに、働きます。", "日曜日なので、働きます。"] },
        { fr: "Alors qu'il avait promis, il n'est pas venu.", answer: "約束したのに、来ませんでした。", wrong: ["約束したので、来ませんでした。", "約束したし、来ませんでした。"] },
        { fr: "C'est bon marché, c'est délicieux : j'y vais souvent.", answer: "安いし、おいしいし、よく行きます。", wrong: ["安いのに、おいしいのに、よく行きます。", "安いけど、おいしいけど、よく行きます。"] },
        { fr: "C'est cher, mais c'est bon.", answer: "高いけど、おいしいです。", wrong: ["高いので、おいしいです。", "高いし、おいしいです。"] },
        { fr: "La chambre est petite, mais elle est propre.", answer: "部屋は狭いけど、きれいです。", wrong: ["部屋は狭いので、きれいです。", "部屋は狭いなのに、きれいです。"] },
        { fr: "Comme c'est calme, j'aime cette ville.", answer: "静かなので、この町が好きです。", wrong: ["静かので、この町が好きです。", "静かのに、この町が好きです。"] },
        { fr: "Il fait beau, mais il fait froid.", answer: "天気はいいけど、寒いです。", wrong: ["天気はいいので、寒いです。", "天気はいいなのに、寒いです。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Comme j'ai mal à la tête, je rentre.", answers: ["頭が痛いので、帰ります。", "あたまがいたいので、かえります。"] },
        { fr: "Alors que j'ai étudié, j'ai raté.", answers: ["勉強したのに、落ちました。", "べんきょうしたのに、おちました。"] },
        { fr: "C'est cher, mais c'est bon.", answers: ["高いけど、おいしいです。", "たかいけど、おいしいです。"] },
        { fr: "Comme c'est congé, je dors.", answers: ["休みなので、寝ます。", "やすみなので、ねます。"] },
        { fr: "C'est bon marché et c'est bon.", answers: ["安いし、おいしいです。", "やすいし、おいしいです。"] },
        { fr: "Bien que ce soit dimanche, je travaille.", answers: ["日曜日なのに、働きます。", "にちようびなのに、はたらきます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-noni", label: "Plus de phrases avec ～のに" },
  },
  {
    id: "n4-but",
    title: "Buts et changements : ために, ように, ようになる, ことにする",
    minutes: 18,
    summary: "Dire dans quel but on agit, parler d'un changement, et d'une décision (la sienne ou celle des autres).",
    sections: [
      {
        title: "Pour : ために",
        formula: "Dictionnaire + [ために]　／　nom + [のために]",
        paragraphs: [
          "[ために] marque un **but** que l'on poursuit volontairement : 日本で働く[ために]、日本語を勉強しています.",
          "Avec un nom : [のために] (pour quelqu'un, pour quelque chose) : 家族[のために]働きます.",
        ],
        examples: [
          { ja: "車を買う[ために]、お金をためています。", reading: "くるまをかう[ために]、おかねをためています。", romaji: "Kuruma o kau [tame ni], okane o tamete imasu.", fr: "J'économise pour acheter une voiture." },
          { ja: "家族[のために]働いています。", reading: "かぞく[のために]はたらいています。", romaji: "Kazoku [no tame ni] hataraite imasu.", fr: "Je travaille pour ma famille." },
        ],
        tip: "ために demande un verbe **volontaire** (買う, 行く) ; pour « afin de pouvoir », on emploie ように.",
      },
      {
        title: "Pour que, afin de pouvoir : ように",
        formula: "Potentiel / forme en ない / verbe non volontaire + [ように]",
        paragraphs: [
          "[ように] marque un but qui ne dépend **pas directement** de la volonté : un verbe potentiel, un verbe en ない, ou un verbe comme わかる, 見える.",
          "忘れない[ように]メモします (je note pour ne pas oublier), 後ろの人にも見える[ように]、大きく書きます.",
        ],
        examples: [
          { ja: "忘れない[ように]、手帳に書きます。", reading: "わすれない[ように]、てちょうにかきます。", romaji: "Wasurenai [you ni], techou ni kakimasu.", fr: "Je l'écris dans mon agenda pour ne pas oublier." },
          { ja: "日本語が話せる[ように]、毎日練習しています。", reading: "にほんごがはなせる[ように]、まいにちれんしゅうしています。", romaji: "Nihongo ga hanaseru [you ni], mainichi renshuu shite imasu.", fr: "Je m'entraîne tous les jours pour pouvoir parler japonais." },
        ],
      },
      {
        title: "Changer et décider : ようになる, ことにする, ことになる",
        formula: "[ようになる] (changement)　[ことにする] (je décide)　[ことになる] (c'est décidé)",
        paragraphs: [
          "[ようになる] : un **changement** d'habitude ou de capacité : 野菜を食べる[ようになりました] (il s'est mis à manger des légumes).",
          "[ことにする] : **je** décide : 会社を辞める[ことにしました]. [ことになる] : la décision vient **d'ailleurs** (l'entreprise, les circonstances) : 大阪で働く[ことになりました].",
        ],
        examples: [
          { ja: "毎朝走る[ことにしました]。", reading: "まいあさはしる[ことにしました]。", romaji: "Maiasa hashiru [koto ni shimashita].", fr: "J'ai décidé de courir tous les matins." },
          { ja: "来月から大阪で働く[ことになりました]。", reading: "らいげつからおおさかではたらく[ことになりました]。", romaji: "Raigetsu kara Oosaka de hataraku [koto ni narimashita].", fr: "Il a été décidé que je travaillerai à Osaka à partir du mois prochain." },
          { ja: "子どもが野菜を食べる[ようになりました]。", reading: "こどもがやさいをたべる[ようになりました]。", romaji: "Kodomo ga yasai o taberu [you ni narimashita].", fr: "Mon enfant s'est mis à manger des légumes." },
        ],
        tip: "ことにしています = une règle qu'on s'est fixée : 毎日日記を書くことにしています.",
      },
    ],
    vocabulary: [
      { ja: "仕事", reading: "しごと", fr: "travail" },
      { ja: "会社", reading: "かいしゃ", fr: "entreprise" },
      { ja: "社長", reading: "しゃちょう", fr: "directeur, PDG" },
      { ja: "工場", reading: "こうじょう", fr: "usine" },
      { ja: "用事", reading: "ようじ", fr: "affaire à régler, course" },
      { ja: "忘れる", reading: "わすれる", fr: "oublier" },
      { ja: "練習", reading: "れんしゅう", fr: "entraînement" },
      { ja: "授業", reading: "じゅぎょう", fr: "cours (en classe)" },
    ],
    kanji: ["事", "仕", "代", "会", "員", "工", "業", "用", "社"],
    keyPoints: [
      "But volontaire : dictionnaire + [ために] ; nom + [のために].",
      "Pour pouvoir, pour ne pas : potentiel ou ない + [ように].",
      "Changement : [ようになる] ; je décide : [ことにする] ; c'est décidé : [ことになる].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "J'économise pour acheter une voiture.", answer: "車を買うために、お金をためています。", wrong: ["車を買ったために、お金をためています。", "車を買うことに、お金をためています。"] },
        { fr: "Je travaille pour ma famille.", answer: "家族のために働いています。", wrong: ["家族ために働いています。", "家族のように働いています。"] },
        { fr: "Je note pour ne pas oublier.", answer: "忘れないように、メモします。", wrong: ["忘れないことに、メモします。", "忘れるように、メモします。"] },
        { fr: "Je m'entraîne pour pouvoir parler japonais.", answer: "日本語が話せるように、練習しています。", wrong: ["日本語が話せるために、練習しています。", "日本語が話せることに、練習しています。"] },
        { fr: "J'ai décidé d'arrêter de fumer.", answer: "たばこをやめることにしました。", wrong: ["たばこをやめることになりました。", "たばこをやめるようになりました。"] },
        { fr: "Il a été décidé que j'irai à Osaka.", answer: "大阪に行くことになりました。", wrong: ["大阪に行くことにしました。", "大阪に行くようになりました。"] },
        { fr: "Je me suis mis·e à manger des légumes.", answer: "野菜を食べるようになりました。", wrong: ["野菜を食べることになりました。", "野菜を食べるためになりました。"] },
        { fr: "Je suis maintenant capable de nager.", answer: "泳げるようになりました。", wrong: ["泳げることになりました。", "泳ぐことにしました。"] },
        { fr: "Je cours tous les matins (règle que je me suis fixée).", answer: "毎朝走ることにしています。", wrong: ["毎朝走ることになっています。", "毎朝走るためにしています。"] },
        { fr: "Je vais au Japon pour étudier.", answer: "勉強するために、日本に行きます。", wrong: ["勉強したために、日本に行きます。", "勉強することに、日本に行きます。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Je travaille pour ma famille.", answers: ["家族のために働きます。", "かぞくのためにはたらきます。", "家族のために働いています。", "かぞくのためにはたらいています。"] },
        { fr: "J'ai décidé d'aller au Japon.", answers: ["日本に行くことにしました。", "にほんにいくことにしました。"] },
        { fr: "Il a été décidé que je travaille à Osaka.", answers: ["大阪で働くことになりました。", "おおさかではたらくことになりました。"] },
        { fr: "Je suis maintenant capable de lire les kanji.", answers: ["漢字が読めるようになりました。", "かんじがよめるようになりました。"] },
        { fr: "Je note pour ne pas oublier.", answers: ["忘れないようにメモします。", "わすれないようにメモします。"] },
        { fr: "J'étudie pour aller au Japon.", answers: ["日本に行くために勉強しています。", "にほんにいくためにべんきょうしています。", "日本に行くために勉強します。", "にほんにいくためにべんきょうします。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n4-you-ni-suru", label: "Plus de phrases avec ～ようにする" },
  },
];
