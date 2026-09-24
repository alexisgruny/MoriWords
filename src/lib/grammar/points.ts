// Référentiel de grammaire japonaise classé par niveau JLPT. Jeu de données
// curé à la main (statique : gratuit, instantané, testable) ; pour l'étendre,
// ajouter simplement une entrée avec un id unique.

export type GrammarLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export const GRAMMAR_LEVELS: GrammarLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export type GrammarExample = {
  ja: string;
  fr: string;
};

export type GrammarPoint = {
  id: string;
  level: GrammarLevel;
  pattern: string;
  meaning: string;
  formation: string;
  explanation: string;
  examples: GrammarExample[];
};

export const grammarPoints: GrammarPoint[] = [
  // ---------------------------------------------------------------- N5
  {
    id: "n5-wa-desu",
    level: "N5",
    pattern: "AはBです",
    meaning: "A est B",
    formation: "Nom + は + Nom + です",
    explanation:
      "Structure de base pour définir ou présenter. は (lu « wa ») marque le thème de la phrase, です est la copule polie.",
    examples: [
      { ja: "私は学生です。", fr: "Je suis étudiant(e)." },
      { ja: "これは私の本です。", fr: "Ceci est mon livre." },
    ],
  },
  {
    id: "n5-wo",
    level: "N5",
    pattern: "～を",
    meaning: "particule de l'objet direct",
    formation: "Nom + を + Verbe",
    explanation: "を marque l'objet direct de l'action exprimée par le verbe.",
    examples: [
      { ja: "水を飲みます。", fr: "Je bois de l'eau." },
      { ja: "毎朝、パンを食べます。", fr: "Je mange du pain tous les matins." },
    ],
  },
  {
    id: "n5-ni-he",
    level: "N5",
    pattern: "～に／へ",
    meaning: "vers, à (direction, destination)",
    formation: "Lieu + に／へ + Verbe de déplacement",
    explanation:
      "に et へ (lu « e ») indiquent la destination d'un déplacement. に peut aussi marquer un moment précis ou un point d'arrivée.",
    examples: [
      { ja: "学校に行きます。", fr: "Je vais à l'école." },
      { ja: "七時に起きます。", fr: "Je me lève à sept heures." },
    ],
  },
  {
    id: "n5-de",
    level: "N5",
    pattern: "～で",
    meaning: "à (lieu de l'action), avec / en (moyen)",
    formation: "Nom + で + Verbe",
    explanation:
      "で indique le lieu où se déroule une action, ou le moyen / l'outil utilisé pour la réaliser.",
    examples: [
      { ja: "図書館で勉強します。", fr: "J'étudie à la bibliothèque." },
      { ja: "バスで行きます。", fr: "J'y vais en bus." },
    ],
  },
  {
    id: "n5-ga-suki",
    level: "N5",
    pattern: "～が好きです",
    meaning: "aimer ～",
    formation: "Nom + が + 好きです",
    explanation:
      "Pour exprimer un goût, l'objet aimé est marqué par が (et non を). Même construction avec 嫌いです (ne pas aimer) ou 上手です (être doué).",
    examples: [
      { ja: "猫が好きです。", fr: "J'aime les chats." },
      { ja: "私は日本の料理が好きです。", fr: "J'aime la cuisine japonaise." },
    ],
  },
  {
    id: "n5-tai",
    level: "N5",
    pattern: "～たいです",
    meaning: "vouloir ～",
    formation: "Verbe (base en ます sans ます) + たいです",
    explanation:
      "Exprime le désir de celui qui parle de faire une action. Se conjugue comme un adjectif en い (たくないです = ne pas vouloir).",
    examples: [
      { ja: "日本に行きたいです。", fr: "Je veux aller au Japon." },
      { ja: "何を食べたいですか。", fr: "Qu'est-ce que tu veux manger ?" },
    ],
  },
  {
    id: "n5-te-kudasai",
    level: "N5",
    pattern: "～てください",
    meaning: "s'il vous plaît, faites ～",
    formation: "Verbe (forme て) + ください",
    explanation: "Demande polie ou instruction adressée à quelqu'un.",
    examples: [
      { ja: "ここに名前を書いてください。", fr: "Veuillez écrire votre nom ici." },
      { ja: "ゆっくり話してください。", fr: "Parlez lentement, s'il vous plaît." },
    ],
  },
  {
    id: "n5-te-iru",
    level: "N5",
    pattern: "～ている",
    meaning: "être en train de ～ / état résultant",
    formation: "Verbe (forme て) + いる",
    explanation:
      "Exprime une action en cours ou un état qui dure (habitude, résultat d'une action, situation).",
    examples: [
      { ja: "今、本を読んでいます。", fr: "Je suis en train de lire un livre." },
      { ja: "東京に住んでいます。", fr: "J'habite à Tokyo." },
    ],
  },
  {
    id: "n5-kara",
    level: "N5",
    pattern: "～から",
    meaning: "parce que ～ / depuis ～",
    formation: "Proposition + から",
    explanation:
      "Après une proposition, から donne la cause. Après un nom de temps ou de lieu, il signifie « à partir de ».",
    examples: [
      { ja: "忙しいですから、行きません。", fr: "Comme je suis occupé, je n'y vais pas." },
      { ja: "九時から仕事です。", fr: "Le travail commence à neuf heures." },
    ],
  },
  {
    id: "n5-mashou",
    level: "N5",
    pattern: "～ましょう",
    meaning: "faisons ～ !",
    formation: "Verbe (base en ます) + ましょう",
    explanation: "Proposition ou invitation à faire quelque chose ensemble.",
    examples: [
      { ja: "一緒に食べましょう。", fr: "Mangeons ensemble." },
      { ja: "そろそろ帰りましょう。", fr: "Rentrons, il se fait tard." },
    ],
  },
  {
    id: "n5-te-mo-ii",
    level: "N5",
    pattern: "～てもいいです",
    meaning: "on peut ～, il est permis de ～",
    formation: "Verbe (forme て) + もいいです",
    explanation: "Demande ou donne une permission. À la forme interrogative (いいですか), on demande l'autorisation.",
    examples: [
      { ja: "ここで写真を撮ってもいいですか。", fr: "Puis-je prendre des photos ici ?" },
      { ja: "もう帰ってもいいです。", fr: "Vous pouvez rentrer maintenant." },
    ],
  },
  {
    id: "n5-naide-kudasai",
    level: "N5",
    pattern: "～ないでください",
    meaning: "ne ～ pas, s'il vous plaît",
    formation: "Verbe (forme ない) + でください",
    explanation: "Demande polie de ne pas faire quelque chose.",
    examples: [
      { ja: "ここで走らないでください。", fr: "Ne courez pas ici, s'il vous plaît." },
      { ja: "心配しないでください。", fr: "Ne vous inquiétez pas." },
    ],
  },
  {
    id: "n5-aru-iru",
    level: "N5",
    pattern: "～があります／います",
    meaning: "il y a ～ (existence)",
    formation: "Lieu + に + Nom + が + あります (inanimé) / います (animé)",
    explanation:
      "あります s'utilise pour les choses (et plantes), います pour les êtres vivants qui se déplacent (personnes, animaux).",
    examples: [
      { ja: "机の上に本があります。", fr: "Il y a un livre sur le bureau." },
      { ja: "公園に子どもがいます。", fr: "Il y a des enfants dans le parc." },
    ],
  },
  {
    id: "n5-yori-hou-ga",
    level: "N5",
    pattern: "AよりBのほうが～",
    meaning: "B est plus ～ que A",
    formation: "A + より + B + のほうが + Adjectif",
    explanation: "Comparaison entre deux éléments. Le point de comparaison est marqué par より.",
    examples: [
      { ja: "電車よりバスのほうが安いです。", fr: "Le bus est moins cher que le train." },
      { ja: "夏より冬のほうが好きです。", fr: "Je préfère l'hiver à l'été." },
    ],
  },

  // ---------------------------------------------------------------- N4
  {
    id: "n4-koto-ga-aru",
    level: "N4",
    pattern: "～たことがある",
    meaning: "avoir déjà fait ～ (expérience)",
    formation: "Verbe (forme た) + ことがある",
    explanation: "Exprime une expérience vécue au moins une fois dans le passé.",
    examples: [
      { ja: "富士山に登ったことがあります。", fr: "J'ai déjà escaladé le mont Fuji." },
      { ja: "寿司を食べたことがありません。", fr: "Je n'ai jamais mangé de sushi." },
    ],
  },
  {
    id: "n4-nagara",
    level: "N4",
    pattern: "～ながら",
    meaning: "tout en ～ (deux actions simultanées)",
    formation: "Verbe (base en ます) + ながら",
    explanation:
      "Deux actions faites en même temps par la même personne. L'action principale est celle du verbe final.",
    examples: [
      { ja: "音楽を聞きながら勉強します。", fr: "J'étudie en écoutant de la musique." },
      { ja: "歩きながら話しましょう。", fr: "Parlons en marchant." },
    ],
  },
  {
    id: "n4-to-omou",
    level: "N4",
    pattern: "～と思う",
    meaning: "je pense que ～",
    formation: "Forme neutre + と思う",
    explanation: "Exprime une opinion ou une supposition personnelle, avec la proposition en forme neutre.",
    examples: [
      { ja: "明日は雨が降ると思います。", fr: "Je pense qu'il pleuvra demain." },
      { ja: "彼は来ないと思います。", fr: "Je pense qu'il ne viendra pas." },
    ],
  },
  {
    id: "n4-you-ni-suru",
    level: "N4",
    pattern: "～ようにする",
    meaning: "faire en sorte de ～ / s'efforcer de ～",
    formation: "Verbe (forme dictionnaire / ない) + ようにする",
    explanation: "Indique un effort conscient et régulier pour faire (ou ne pas faire) quelque chose.",
    examples: [
      { ja: "毎日運動するようにしています。", fr: "Je m'efforce de faire de l'exercice tous les jours." },
      { ja: "夜は甘いものを食べないようにしている。", fr: "J'évite de manger sucré le soir." },
    ],
  },
  {
    id: "n4-nakereba-naranai",
    level: "N4",
    pattern: "～なければならない",
    meaning: "devoir ～ (obligation)",
    formation: "Verbe (forme ない sans い) + なければならない",
    explanation:
      "Exprime une obligation. Variante courante à l'oral : ～なきゃ. Avec なくてもいい, on dit qu'il n'est pas nécessaire.",
    examples: [
      { ja: "明日までに宿題をしなければなりません。", fr: "Je dois faire mes devoirs d'ici demain." },
      { ja: "薬を飲まなければならない。", fr: "Il faut que je prenne mon médicament." },
    ],
  },
  {
    id: "n4-temo",
    level: "N4",
    pattern: "～ても",
    meaning: "même si ～, bien que ～",
    formation: "Verbe (forme て) + も / Adjectif い : ～くても",
    explanation: "Exprime une concession : le résultat reste le même malgré la condition.",
    examples: [
      { ja: "雨が降っても、行きます。", fr: "J'irai même s'il pleut." },
      { ja: "高くても、買いたいです。", fr: "Même si c'est cher, je veux l'acheter." },
    ],
  },
  {
    id: "n4-sou-da",
    level: "N4",
    pattern: "～そうだ (apparence)",
    meaning: "avoir l'air ～, sembler ～",
    formation: "Adjectif (sans い / な) ou verbe (base ます) + そうだ",
    explanation:
      "Jugement fondé sur l'apparence visible. Attention : ～そうだ après une forme neutre signifie « il paraît que » (ouï-dire), un autre point.",
    examples: [
      { ja: "このケーキはおいしそうです。", fr: "Ce gâteau a l'air délicieux." },
      { ja: "今にも雨が降りそうです。", fr: "On dirait qu'il va pleuvoir d'un instant à l'autre." },
    ],
  },
  {
    id: "n4-sugiru",
    level: "N4",
    pattern: "～すぎる",
    meaning: "trop ～, excessivement ～",
    formation: "Verbe (base ます) / Adjectif (sans い / な) + すぎる",
    explanation: "Indique qu'on dépasse la mesure raisonnable ; souvent négatif.",
    examples: [
      { ja: "昨日は食べすぎました。", fr: "J'ai trop mangé hier." },
      { ja: "この問題は難しすぎる。", fr: "Ce problème est trop difficile." },
    ],
  },
  {
    id: "n4-ba",
    level: "N4",
    pattern: "～ば",
    meaning: "si ～ (condition)",
    formation: "Verbe : terminaison en え + ば / Adjectif い : ～ければ",
    explanation:
      "Condition dont le résultat est naturel ou prévisible. La forme ば est souvent utilisée pour des conseils ou des conditions générales.",
    examples: [
      { ja: "安ければ、買います。", fr: "Si c'est bon marché, j'achète." },
      { ja: "急げば、間に合います。", fr: "Si tu te dépêches, tu seras à l'heure." },
    ],
  },
  {
    id: "n4-tara",
    level: "N4",
    pattern: "～たら",
    meaning: "quand ～ / si ～",
    formation: "Verbe (forme た) + ら",
    explanation:
      "Condition ou moment futur : une fois que la première action est accomplie, la suite a lieu. Très polyvalent à l'oral.",
    examples: [
      { ja: "家に着いたら、電話します。", fr: "Je téléphonerai quand je serai arrivé à la maison." },
      { ja: "時間があったら、遊びに来てください。", fr: "Si vous avez le temps, venez nous voir." },
    ],
  },
  {
    id: "n4-koto-ga-dekiru",
    level: "N4",
    pattern: "～ことができる",
    meaning: "pouvoir ～, être capable de ～",
    formation: "Verbe (forme dictionnaire) + ことができる",
    explanation:
      "Exprime la capacité ou la possibilité. Équivalent de la forme potentielle du verbe (食べられる).",
    examples: [
      { ja: "日本語を話すことができます。", fr: "Je sais parler japonais." },
      { ja: "ここでは泳ぐことができません。", fr: "On ne peut pas nager ici." },
    ],
  },
  {
    id: "n4-te-oku",
    level: "N4",
    pattern: "～ておく",
    meaning: "faire ～ à l'avance / laisser en l'état",
    formation: "Verbe (forme て) + おく",
    explanation: "Action faite en préparation de quelque chose, ou résultat volontairement laissé tel quel.",
    examples: [
      { ja: "旅行の前にホテルを予約しておきます。", fr: "Je réserve l'hôtel avant le voyage." },
      { ja: "窓を開けておいてください。", fr: "Laissez la fenêtre ouverte, s'il vous plaît." },
    ],
  },
  {
    id: "n4-noni",
    level: "N4",
    pattern: "～のに",
    meaning: "bien que ～, alors que ～",
    formation: "Forme neutre (な-adj / nom : ～なのに) + のに",
    explanation:
      "Exprime un résultat contraire à l'attente, souvent avec une nuance de regret ou de surprise.",
    examples: [
      { ja: "勉強したのに、テストが難しかったです。", fr: "J'ai étudié, et pourtant l'examen était difficile." },
      { ja: "春なのに、まだ寒いです。", fr: "C'est le printemps, mais il fait encore froid." },
    ],
  },

  // ---------------------------------------------------------------- N3
  {
    id: "n3-bakari",
    level: "N3",
    pattern: "～ばかり",
    meaning: "ne faire que ～ / venir de ～",
    formation: "Verbe (forme て) + ばかりいる / Verbe (forme た) + ばかりだ",
    explanation:
      "Avec la forme て : action répétée excessivement (nuance de reproche). Avec la forme た : action tout juste terminée.",
    examples: [
      { ja: "彼は遊んでばかりいます。", fr: "Il ne fait que jouer." },
      { ja: "日本に来たばかりです。", fr: "Je viens d'arriver au Japon." },
    ],
  },
  {
    id: "n3-koto-ni-suru",
    level: "N3",
    pattern: "～ことにする",
    meaning: "décider de ～",
    formation: "Verbe (forme dictionnaire / ない) + ことにする",
    explanation: "Décision prise par le locuteur lui-même.",
    examples: [
      { ja: "来月から日本語学校に通うことにしました。", fr: "J'ai décidé de suivre des cours de japonais dès le mois prochain." },
      { ja: "お酒は飲まないことにした。", fr: "J'ai décidé de ne plus boire d'alcool." },
    ],
  },
  {
    id: "n3-koto-ni-naru",
    level: "N3",
    pattern: "～ことになる",
    meaning: "il est décidé que ～ / cela finit par ～",
    formation: "Verbe (forme dictionnaire / ない) + ことになる",
    explanation:
      "Résultat ou décision qui ne dépend pas (ou pas entièrement) du locuteur : règle, décision de l'entreprise, concours de circonstances.",
    examples: [
      { ja: "来年、大阪に転勤することになりました。", fr: "Il a été décidé que je serai muté à Osaka l'an prochain." },
      { ja: "この部屋では食事しないことになっている。", fr: "Il est de règle de ne pas manger dans cette pièce." },
    ],
  },
  {
    id: "n3-rashii",
    level: "N3",
    pattern: "～らしい",
    meaning: "il paraît que ～ / typique de ～",
    formation: "Forme neutre + らしい / Nom + らしい",
    explanation:
      "Supposition fondée sur des informations entendues. Collé à un nom, il signifie « digne de, typique de ».",
    examples: [
      { ja: "彼は病気らしいです。", fr: "Il paraît qu'il est malade." },
      { ja: "今日は春らしい天気ですね。", fr: "Il fait un temps bien printanier aujourd'hui." },
    ],
  },
  {
    id: "n3-you-da",
    level: "N3",
    pattern: "～ようだ／みたいだ",
    meaning: "il semble que ～, on dirait que ～",
    formation: "Forme neutre (な-adj : ～な / nom : ～の) + ようだ",
    explanation:
      "Jugement du locuteur basé sur ce qu'il perçoit directement. みたいだ est la version plus familière.",
    examples: [
      { ja: "誰かいるようです。", fr: "Il semble y avoir quelqu'un." },
      { ja: "彼は疲れているみたいだ。", fr: "Il a l'air fatigué." },
    ],
  },
  {
    id: "n3-hazu-da",
    level: "N3",
    pattern: "～はずだ",
    meaning: "il est censé ～, cela doit être ～",
    formation: "Forme neutre (な-adj : ～な / nom : ～の) + はずだ",
    explanation: "Forte conviction fondée sur un raisonnement ou une information. Négation : ～はずがない.",
    examples: [
      { ja: "彼はもう着いているはずです。", fr: "Il devrait déjà être arrivé." },
      { ja: "そんなはずはありません。", fr: "Ça ne peut pas être vrai." },
    ],
  },
  {
    id: "n3-wake-dewa-nai",
    level: "N3",
    pattern: "～わけではない",
    meaning: "ce n'est pas que ～",
    formation: "Forme neutre + わけではない",
    explanation: "Nie une conclusion qu'on pourrait tirer trop vite : nuance « pas forcément ».",
    examples: [
      { ja: "嫌いなわけではありません。", fr: "Ce n'est pas que je n'aime pas ça." },
      { ja: "お金がないわけじゃないけど、買わない。", fr: "Ce n'est pas que je manque d'argent, mais je n'achète pas." },
    ],
  },
  {
    id: "n3-tame-ni",
    level: "N3",
    pattern: "～ために",
    meaning: "afin de ～ / à cause de ～",
    formation: "Verbe (forme dictionnaire) / Nom + の + ために",
    explanation:
      "But (avec une action volontaire) ou cause (avec un fait, souvent négatif). Le sujet des deux propositions est le même pour le sens de but.",
    examples: [
      { ja: "試験に合格するために、毎日勉強します。", fr: "J'étudie tous les jours pour réussir l'examen." },
      { ja: "事故のために、電車が遅れました。", fr: "Le train a eu du retard à cause d'un accident." },
    ],
  },
  {
    id: "n3-ni-yoru-to",
    level: "N3",
    pattern: "～によると",
    meaning: "d'après ～, selon ～",
    formation: "Nom + によると + ～そうだ／らしい",
    explanation: "Cite la source d'une information, généralement avec une forme de ouï-dire en fin de phrase.",
    examples: [
      { ja: "天気予報によると、明日は雪だそうです。", fr: "D'après la météo, il neigera demain." },
      { ja: "新聞によると、物価が上がるらしい。", fr: "Selon le journal, les prix vont augmenter." },
    ],
  },
  {
    id: "n3-tokoro-da",
    level: "N3",
    pattern: "～ところだ",
    meaning: "être sur le point de / en train de / venir de ～",
    formation: "Verbe (dict.) / ている / た + ところだ",
    explanation:
      "Précise le moment exact de l'action : juste avant (dict.), pendant (ている), juste après (た).",
    examples: [
      { ja: "今、家を出るところです。", fr: "Je suis sur le point de quitter la maison." },
      { ja: "ちょうど食べ終わったところです。", fr: "Je viens juste de finir de manger." },
    ],
  },
  {
    id: "n3-saseru",
    level: "N3",
    pattern: "～させる",
    meaning: "faire faire ～ / laisser faire ～ (causatif)",
    formation: "Verbe (forme ない) + せる／させる",
    explanation:
      "Le sujet fait faire l'action à quelqu'un (ordre) ou lui permet de la faire. La personne qui agit est marquée par に ou を.",
    examples: [
      { ja: "母は子どもに野菜を食べさせます。", fr: "La mère fait manger des légumes à son enfant." },
      { ja: "先生は学生を帰らせました。", fr: "Le professeur a laissé partir les étudiants." },
    ],
  },
  {
    id: "n3-ni-yotte",
    level: "N3",
    pattern: "～によって",
    meaning: "selon ～, par ～, à cause de ～",
    formation: "Nom + によって",
    explanation:
      "Exprime la variation selon le cas, l'agent d'un passif, le moyen ou la cause. Sens à déduire du contexte.",
    examples: [
      { ja: "人によって考え方が違います。", fr: "La façon de penser varie selon les personnes." },
      { ja: "この本は夏目漱石によって書かれた。", fr: "Ce livre a été écrit par Natsume Sōseki." },
    ],
  },

  // ---------------------------------------------------------------- N2
  {
    id: "n2-ni-chigainai",
    level: "N2",
    pattern: "～に違いない",
    meaning: "à coup sûr ～, ça ne fait aucun doute que ～",
    formation: "Forme neutre (nom / な-adj sans だ) + に違いない",
    explanation: "Forte certitude du locuteur, fondée sur un raisonnement ou des indices.",
    examples: [
      { ja: "この足跡は彼のものに違いない。", fr: "Ces empreintes sont sûrement les siennes." },
      { ja: "あの店は人気があるに違いない。", fr: "Ce magasin doit être très populaire." },
    ],
  },
  {
    id: "n2-wake-ni-wa-ikanai",
    level: "N2",
    pattern: "～わけにはいかない",
    meaning: "on ne peut pas ～ (pour des raisons morales ou pratiques)",
    formation: "Verbe (forme dictionnaire) + わけにはいかない",
    explanation:
      "Impossibilité liée aux circonstances ou aux convenances. Avec ない : ～ないわけにはいかない (on ne peut pas ne pas ～).",
    examples: [
      { ja: "明日は試験だから、遊ぶわけにはいきません。", fr: "J'ai un examen demain, je ne peux pas me permettre de m'amuser." },
      { ja: "約束したので、行かないわけにはいかない。", fr: "J'ai promis, je ne peux pas ne pas y aller." },
    ],
  },
  {
    id: "n2-zaru-o-enai",
    level: "N2",
    pattern: "～ざるを得ない",
    meaning: "ne pas pouvoir faire autrement que ～",
    formation: "Verbe (forme ない sans ない) + ざるを得ない (する → せざるを得ない)",
    explanation: "Contrainte : on est obligé de faire quelque chose malgré soi. Registre écrit ou soutenu.",
    examples: [
      { ja: "上司の命令なので、従わざるを得ない。", fr: "C'est un ordre de mon supérieur, je suis obligé d'obéir." },
      { ja: "雨のため、中止せざるを得なかった。", fr: "À cause de la pluie, nous avons été contraints d'annuler." },
    ],
  },
  {
    id: "n2-ni-taishite",
    level: "N2",
    pattern: "～に対して",
    meaning: "envers ～, à l'égard de ～ / en contraste avec ～",
    formation: "Nom + に対して",
    explanation: "Marque la cible d'une attitude ou d'une action, ou un contraste entre deux éléments.",
    examples: [
      { ja: "客に対して、丁寧に話してください。", fr: "Parlez poliment aux clients." },
      { ja: "兄は明るいのに対して、弟は静かだ。", fr: "Mon grand frère est enjoué, alors que le petit est calme." },
    ],
  },
  {
    id: "n2-ni-oite",
    level: "N2",
    pattern: "～において",
    meaning: "à ～, dans ～ (lieu, moment, domaine)",
    formation: "Nom + において",
    explanation: "Version formelle de で pour situer un événement dans un lieu, un moment ou un domaine.",
    examples: [
      { ja: "会議は東京において開かれた。", fr: "La conférence s'est tenue à Tokyo." },
      { ja: "教育においては、基礎が大切だ。", fr: "En éducation, les bases sont essentielles." },
    ],
  },
  {
    id: "n2-o-hajime",
    level: "N2",
    pattern: "～をはじめ",
    meaning: "à commencer par ～, ～ et tous les autres",
    formation: "Nom + をはじめ(として)",
    explanation: "Cite le premier ou le plus représentatif d'un ensemble, les autres suivant.",
    examples: [
      { ja: "社長をはじめ、社員全員が参加した。", fr: "Tous les employés, à commencer par le président, ont participé." },
      { ja: "京都をはじめ、多くの都市を訪れた。", fr: "J'ai visité de nombreuses villes, Kyoto en tête." },
    ],
  },
  {
    id: "n2-monono",
    level: "N2",
    pattern: "～ものの",
    meaning: "bien que ～, certes ～ mais",
    formation: "Forme neutre + ものの",
    explanation: "Concession écrite : le fait est reconnu, mais la suite ne correspond pas à l'attente.",
    examples: [
      { ja: "買ったものの、一度も使っていない。", fr: "Je l'ai acheté, mais je ne m'en suis jamais servi." },
      { ja: "頭ではわかっているものの、行動に移せない。", fr: "Je comprends bien, mais je n'arrive pas à passer à l'action." },
    ],
  },
  {
    id: "n2-kanenai",
    level: "N2",
    pattern: "～かねない",
    meaning: "risquer de ～ (issue négative)",
    formation: "Verbe (base ます) + かねない",
    explanation:
      "Possibilité d'un résultat négatif. À ne pas confondre avec ～かねる (ne pas pouvoir), sens presque opposé.",
    examples: [
      { ja: "無理をすると、病気になりかねない。", fr: "En se forçant, on risque de tomber malade." },
      { ja: "彼ならそんなことも言いかねない。", fr: "Lui, il serait capable de dire ça." },
    ],
  },
  {
    id: "n2-shidai",
    level: "N2",
    pattern: "～次第",
    meaning: "dès que ～ / cela dépend de ～",
    formation: "Verbe (base ます) + 次第 / Nom + 次第だ",
    explanation:
      "Après un verbe : dès que l'action est faite, on enchaîne (sans passé). Après un nom : « tout dépend de ».",
    examples: [
      { ja: "結果が分かり次第、連絡します。", fr: "Je vous contacterai dès que j'aurai les résultats." },
      { ja: "成功するかどうかはあなた次第だ。", fr: "Réussir ou non ne dépend que de toi." },
    ],
  },
  {
    id: "n2-ni-kagiru",
    level: "N2",
    pattern: "～に限る",
    meaning: "il n'y a rien de mieux que ～",
    formation: "Nom / Verbe (dict.) + に限る",
    explanation: "Exprime une préférence forte ou un conseil : ～ est le meilleur choix.",
    examples: [
      { ja: "夏はビールに限る。", fr: "En été, rien ne vaut une bière." },
      { ja: "風邪のときは寝るに限る。", fr: "Quand on est enrhumé, le mieux est de dormir." },
    ],
  },

  // ---------------------------------------------------------------- N1
  {
    id: "n1-o-yoso-ni",
    level: "N1",
    pattern: "～をよそに",
    meaning: "sans tenir compte de ～, au mépris de ～",
    formation: "Nom + をよそに",
    explanation: "Indique qu'on ignore délibérément l'inquiétude, l'opinion ou l'attente de quelqu'un.",
    examples: [
      { ja: "親の心配をよそに、彼は仕事を辞めた。", fr: "Sans se soucier de l'inquiétude de ses parents, il a quitté son travail." },
      { ja: "周囲の反対をよそに、計画は進められた。", fr: "Le projet a avancé malgré l'opposition de l'entourage." },
    ],
  },
  {
    id: "n1-zu-ni-wa-irarenai",
    level: "N1",
    pattern: "～ずにはいられない",
    meaning: "ne pas pouvoir s'empêcher de ～",
    formation: "Verbe (forme ない sans ない) + ずにはいられない (する → せずにはいられない)",
    explanation: "Une émotion ou une envie irrépressible pousse à agir, involontairement.",
    examples: [
      { ja: "その映画を見て、泣かずにはいられなかった。", fr: "En voyant ce film, je n'ai pas pu m'empêcher de pleurer." },
      { ja: "あのケーキを見ると、食べずにはいられない。", fr: "Devant ce gâteau, je ne peux pas m'empêcher d'en manger." },
    ],
  },
  {
    id: "n1-ni-itaru-made",
    level: "N1",
    pattern: "～に至るまで",
    meaning: "jusqu'à ～, y compris ～",
    formation: "Nom + に至るまで",
    explanation: "Souligne l'étendue, jusqu'à un point extrême ou un détail minime.",
    examples: [
      { ja: "細部に至るまで、丁寧に作られている。", fr: "Tout est fabriqué avec soin, jusque dans les moindres détails." },
      { ja: "子どもから大人に至るまで、この歌を知っている。", fr: "Des enfants aux adultes, tout le monde connaît cette chanson." },
    ],
  },
  {
    id: "n1-o-yogi-naku-sareru",
    level: "N1",
    pattern: "～を余儀なくされる",
    meaning: "être contraint de ～",
    formation: "Nom (action) + を余儀なくされる",
    explanation: "Contrainte due aux circonstances, sans autre choix possible. Registre écrit.",
    examples: [
      { ja: "台風のため、試合は中止を余儀なくされた。", fr: "À cause du typhon, le match a dû être annulé." },
      { ja: "不況で、会社は縮小を余儀なくされた。", fr: "En raison de la récession, l'entreprise a été forcée de se réduire." },
    ],
  },
  {
    id: "n1-katawara",
    level: "N1",
    pattern: "～かたわら",
    meaning: "tout en ～ (activité menée en parallèle)",
    formation: "Verbe (dict.) / Nom + の + かたわら",
    explanation: "Deux activités menées de front sur la durée, l'une principale, l'autre secondaire.",
    examples: [
      { ja: "彼は会社で働くかたわら、小説を書いている。", fr: "Tout en travaillant en entreprise, il écrit des romans." },
      { ja: "仕事のかたわら、大学院に通っている。", fr: "En parallèle de son travail, elle suit des études supérieures." },
    ],
  },
  {
    id: "n1-te-yamanai",
    level: "N1",
    pattern: "～てやまない",
    meaning: "～ sans cesse, du fond du cœur",
    formation: "Verbe (forme て) + やまない",
    explanation: "Sentiment profond et durable (souhait, respect, amour). S'emploie surtout avec des verbes d'émotion.",
    examples: [
      { ja: "彼の成功を願ってやまない。", fr: "Je lui souhaite sincèrement de réussir." },
      { ja: "この作家を尊敬してやまない。", fr: "J'ai une admiration sans bornes pour cet écrivain." },
    ],
  },
  {
    id: "n1-nara-dewa",
    level: "N1",
    pattern: "～ならでは",
    meaning: "propre à ～, que seul ～ peut offrir",
    formation: "Nom + ならでは",
    explanation: "Éloge d'une qualité unique, que l'on ne trouve que chez ce sujet.",
    examples: [
      { ja: "京都ならではの風景を楽しんだ。", fr: "J'ai profité de paysages que seule Kyoto peut offrir." },
      { ja: "これは職人ならではの技だ。", fr: "C'est un savoir-faire que seuls les artisans possèdent." },
    ],
  },
  {
    id: "n1-o-kinjienai",
    level: "N1",
    pattern: "～を禁じ得ない",
    meaning: "ne pas pouvoir retenir ～ (émotion)",
    formation: "Nom (émotion) + を禁じ得ない",
    explanation: "Très formel : une émotion (larmes, colère, surprise) qu'on ne peut contenir.",
    examples: [
      { ja: "その光景に、涙を禁じ得なかった。", fr: "Devant cette scène, je n'ai pu retenir mes larmes." },
      { ja: "彼の態度には怒りを禁じ得ない。", fr: "Son attitude me met dans une colère que je ne peux réprimer." },
    ],
  },
  {
    id: "n1-ni-sokushite",
    level: "N1",
    pattern: "～に即して",
    meaning: "conformément à ～, en accord avec ～",
    formation: "Nom + に即して",
    explanation: "Agir en s'appuyant sur une règle, une réalité ou des faits concrets.",
    examples: [
      { ja: "現状に即して、計画を見直す。", fr: "Nous révisons le plan en fonction de la situation actuelle." },
      { ja: "事実に即して報告してください。", fr: "Faites votre rapport en vous en tenant aux faits." },
    ],
  },
  {
    id: "n1-tarimo",
    level: "N1",
    pattern: "～たりとも～ない",
    meaning: "pas même ～",
    formation: "Quantité minimale (一) + たりとも + négation",
    explanation: "Insiste sur le fait que même la plus petite quantité n'est pas permise.",
    examples: [
      { ja: "一円たりとも無駄にできない。", fr: "On ne peut gaspiller un seul yen." },
      { ja: "一瞬たりとも気を抜けない。", fr: "On ne peut relâcher son attention même un instant." },
    ],
  },
  {
    id: "n1-to-iedomo",
    level: "N1",
    pattern: "～といえども",
    meaning: "même si ～, aussi ～ soit-il",
    formation: "Nom / Forme neutre + といえども",
    explanation: "Concession soutenue : même dans le cas de ～, la conclusion s'applique.",
    examples: [
      { ja: "専門家といえども、間違えることはある。", fr: "Même un expert peut se tromper." },
      { ja: "子どもといえども、責任は取らなければならない。", fr: "Tout enfant qu'il soit, il doit assumer ses responsabilités." },
    ],
  },
  {
    id: "n1-to-mo-naru-to",
    level: "N1",
    pattern: "～ともなると",
    meaning: "une fois devenu ～, quand il s'agit de ～",
    formation: "Nom (statut, moment) + ともなると",
    explanation: "Quand on atteint un certain statut ou stade, il est naturel que la conséquence suive.",
    examples: [
      { ja: "大学生ともなると、責任も重くなる。", fr: "Arrivé à l'université, les responsabilités s'alourdissent." },
      { ja: "年末ともなると、街は賑やかになる。", fr: "À la fin de l'année, la ville s'anime." },
    ],
  },
];

// Filtre les points de grammaire par niveau JLPT (ou tous) et par texte
// libre, cherché dans le motif, le sens et l'explication (sans accents ni casse).
export function filterGrammarPoints(
  points: GrammarPoint[],
  level: GrammarLevel | "all",
  query: string,
): GrammarPoint[] {
  const normalize = (value: string) =>
    value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const normalizedQuery = normalize(query.trim());

  return points.filter((point) => {
    if (level !== "all" && point.level !== level) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [point.pattern, point.meaning, point.explanation, point.formation].some((field) =>
      normalize(field).includes(normalizedQuery),
    );
  });
}
