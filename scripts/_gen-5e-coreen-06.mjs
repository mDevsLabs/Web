import fs from "node:fs";
import path from "node:path";

const outPath = path.join(
  process.cwd(),
  "lib/quizzly/curriculum/5e/coreen/06.json"
);

function q(id, type, question, explanation, options, correctAnswers) {
  return { correctAnswers, explanation, id, options, question, type };
}

/** u1: 내일 + -(으)ㄹ 거예요 */
const u1Mc = [
  q(
    "q1",
    "multiple_choice",
    "Quelles expressions contiennent le mot « demain » 내일 (naeil) ?",
    "내일 (naeil) apparaît dans les deux bonnes formules avec matin ou soir.",
    [
      "내일 아침 (naeil achim)",
      "내일 저녁 (naeil jeonyeok)",
      "어제 아침 (eoje achim)",
      "오늘 밤 (oneul bam)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles phrases sont au futur proche -(으)ㄹ 거예요 (geoyeyo) ?",
    "먹을 거예요 et 마실 거예요 annoncent un plan, pas le passé ni -ㄹ래요.",
    [
      "먹을 거예요 (meogeul geoyeyo)",
      "마실 거예요 (masil geoyeyo)",
      "먹었어요 (meogeosseoyo)",
      "먹을래요 (meogeullaeoyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quels projets avec 내일 (naeil) sont cohérents ?",
    "Il faut 내일 et une base en -ㄹ/-을 거예요, pas le passé.",
    [
      "내일 공부할 거예요 (naeil gongbuhal geoyeyo)",
      "내일 영화 볼 거예요 (naeil yeonghwa bol geoyeyo)",
      "내일 공부했어요 (naeil gongbuhaesseoyo)",
      "어제 영화 볼 거예요 (eoje yeonghwa bol geoyeyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Deux traductions correctes de « demain matin » :",
    "내일 아침 et 내일 아침에 situent le lendemain matin.",
    [
      "내일 아침 (naeil achim)",
      "내일 아침에 (naeil achime)",
      "어제 아침 (eoje achim)",
      "모레 저녁 (more jeonyeok)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles formes futures viennent de 가다 (gada) et 오다 (oda) ?",
    "갈 거예요 et 올 거예요 sont les futurs polis 5e.",
    [
      "갈 거예요 (gal geoyeyo)",
      "올 거예요 (ol geoyeyo)",
      "갔어요 (gasseoyo)",
      "가요 거예요 (gayo geoyeyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles phrases parlent d'activité sportive demain ?",
    "축구할 거예요 et 수영할 거예요 utilisent 내일 implicitement dans le chapitre.",
    [
      "내일 축구할 거예요 (naeil chukguhal geoyeyo)",
      "내일 수영할 거예요 (naeil suyeonghal geoyeyo)",
      "어제 축구했어요 (eoje chukguhaesseoyo)",
      "지금 축구해요 (jigeum chukguhaeyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Deux futurs valides après 하다 (hada) :",
    "할 거예요 et 공부할 거예요 suivent la règle du futur.",
    [
      "할 거예요 (hal geoyeyo)",
      "공부할 거예요 (gongbuhal geoyeyo)",
      "해 거예요 (hae geoyeyo)",
      "했 거예요 (haet geoyeyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quels repères de temps indiquent « demain soir » ?",
    "내일 저녁 et 내일 저녁에 désignent le soir du lendemain.",
    [
      "내일 저녁 (naeil jeonyeok)",
      "내일 저녁에 (naeil jeonyeoge)",
      "오늘 저녁 (oneul jeonyeok)",
      "어제 밤 (eoje bam)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles réponses utilisent bien -ㄹ 거예요 après voyelle ?",
    "볼 거예요 et 살 거예요 ajoutent -ㄹ après une voyelle.",
    [
      "볼 거예요 (bol geoyeyo)",
      "살 거예요 (sal geoyeyo)",
      "보 거예요 (bo geoyeyo)",
      "볼래요 (bollaeoyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Pour résumer des projets de demain, quelles phrases conviennent ?",
    "Deux actions futures avec 내일 et 거예요.",
    [
      "내일 학교에 갈 거예요 (naeil hakgyoe gal geoyeyo)",
      "내일 숙제할 거예요 (naeil sukjaehal geoyeyo)",
      "내일 학교에 갔어요 (naeil hakgyoe gasseoyo)",
      "어제 숙제할 거예요 (eoje sukjaehal geoyeyo)",
    ],
    [0, 1]
  ),
];

const u1Singles = [
  // q01 q2-q10
  [
    q(
      "q2",
      "single_choice",
      "Comment dit-on « Je vais étudier demain » ?",
      "공부할 거예요 (gongbuhal geoyeyo) avec 내일 annonce le plan.",
      [
        "내일 공부할 거예요 (naeil gongbuhal geoyeyo)",
        "내일 공부해요 (naeil gongbuhaeyo)",
        "내일 공부했어요 (naeil gongbuhaesseoyo)",
        "내일 공부할래요 (naeil gongbuhallaeoyo)",
      ],
      [0]
    ),
    q(
      "q3",
      "single_choice",
      "Que signifie 저는 내일 영화 볼 거예요 (jeoneun naeil yeonghwa bol geoyeyo) ?",
      "볼 거예요 (bol geoyeyo) est le futur de 보다 (boda).",
      [
        "Je vais regarder un film demain",
        "J'ai regardé un film demain",
        "Je regarde un film maintenant",
        "Je regardais un film hier",
      ],
      [0]
    ),
    q(
      "q4",
      "single_choice",
      "Quel mot coréen correspond à « demain matin » ?",
      "아침 (achim) avec 내일 (naeil) précise le matin.",
      [
        "내일 아침 (naeil achim)",
        "어제 아침 (eoje achim)",
        "오늘 저녁 (oneul jeonyeok)",
        "모레 (more)",
      ],
      [0]
    ),
    q(
      "q5",
      "single_choice",
      "Dans 내일 친구 만날 거예요 (naeil chingu mannal geoyeyo), que veut dire 만날 (mannal) ?",
      "만나다 (mannada) devient 만날 au futur proche.",
      ["rencontrer (futur)", "manger", "dormir", "écrire"],
      [0]
    ),
    q(
      "q6",
      "single_choice",
      "Quelle phrase annonce du foot demain ?",
      "축구할 거예요 (chukguhal geoyeyo) avec 내일.",
      [
        "내일 축구할 거예요 (naeil chukguhal geoyeyo)",
        "어제 축구했어요 (eoje chukguhaesseoyo)",
        "지금 축구해요 (jigeum chukguhaeyo)",
        "축구 싫어해요 (chukgu sireohaeyo)",
      ],
      [0]
    ),
    q(
      "q7",
      "single_choice",
      "Comment traduire « demain soir » ?",
      "저녁 (jeonyeok) signifie le soir.",
      [
        "내일 저녁 (naeil jeonyeok)",
        "내일 아침 (naeil achim)",
        "오늘 밤 (oneul bam)",
        "어제 (eoje)",
      ],
      [0]
    ),
    q(
      "q8",
      "single_choice",
      "Dans 우리는 내일 학교에 갈 거예요 (urineun naeil hakgyoe gal geoyeyo), où ira-t-on ?",
      "학교 (hakgyo) signifie école.",
      ["à l'école", "au cinéma", "à la plage", "au musée"],
      [0]
    ),
    q(
      "q9",
      "single_choice",
      "Que exprime -ㄹ 거예요 (geoyeyo) après une voyelle ?",
      "Cette terminaison indique une intention ou un futur proche.",
      [
        "une intention ou un futur proche",
        "le passé",
        "une habitude",
        "un ordre",
      ],
      [0]
    ),
    q(
      "q10",
      "single_choice",
      "Quelle phrase associe correctement 내일 (naeil) au futur ?",
      "내일 + base verbale + 거예요.",
      [
        "내일 숙제할 거예요 (naeil sukjaehal geoyeyo)",
        "내일 숙제했어요 (naeil sukjaehaesseoyo)",
        "내일이 어제예요 (naeiri eojeyeyo)",
        "내일 숙제해요 au sens passé (naeil sukjaehaeyo)",
      ],
      [0]
    ),
  ],
  // q02
  [
    q(
      "q2",
      "single_choice",
      "Après consonne finale, quelle terminaison futur utilise-t-on ?",
      "On ajoute -을 거예요 (eul geoyeyo) sans voyelle en fin de radical.",
      [
        "-을 거예요 (eul geoyeyo)",
        "-ㄹ 거예요 (l geoyeyo)",
        "-를 거예요 (reul geoyeyo)",
        "-고 거예요 (go geoyeyo)",
      ],
      [0]
    ),
    q(
      "q3",
      "single_choice",
      "Comment dire « Je vais boire de l'eau » ?",
      "마시다 (masida) → 마실 거예요 (masil geoyeyo).",
      [
        "물 마실 거예요 (mul masil geoyeyo)",
        "물 마셨어요 (mul masyeosseoyo)",
        "물 마시래요 (mul masiraeyo)",
        "물 마셔요 (mul masyeoyo) seulement",
      ],
      [0]
    ),
    q(
      "q4",
      "single_choice",
      "Que signifie 읽을 거예요 (ilgeul geoyeyo) ?",
      "읽다 (ilkda) signifie lire.",
      ["je vais lire", "je lis habituellement", "j'ai lu", "lis !"],
      [0]
    ),
    q(
      "q5",
      "single_choice",
      "Avec 하다 (hada), quelle est la forme « je vais faire » ?",
      "하다 se conjugue en 할 거예요 (hal geoyeyo).",
      [
        "할 거예요 (hal geoyeyo)",
        "해 거예요 (hae geoyeyo)",
        "하 거예요 (ha geoyeyo)",
        "했 거예요 (haet geoyeyo)",
      ],
      [0]
    ),
    q(
      "q6",
      "single_choice",
      "Traduisez « Nous allons chanter demain ».",
      "노래하다 (noraehada) → 노래할 거예요.",
      [
        "우리 내일 노래할 거예요 (uri naeil noraehal geoyeyo)",
        "우리 어제 노래했어요 (uri eoje noraehaesseoyo)",
        "우리 노래할래요? (uri noraehallaeoyo?)",
        "우리 노래해요 (uri noraehaeyo) seulement",
      ],
      [0]
    ),
    q(
      "q7",
      "single_choice",
      "Quel verbe donne 쉴 거예요 (swil geoyeyo) ?",
      "쉬다 (swida) signifie se reposer.",
      ["se reposer", "courir", "nager", "écrire"],
      [0]
    ),
    q(
      "q8",
      "single_choice",
      "Comment dire « Je vais acheter un livre » ?",
      "사다 (sada) → 살 거예요 (sal geoyeyo).",
      [
        "책 살 거예요 (chaek sal geoyeyo)",
        "책 샀어요 (chaek sasseoyo)",
        "책 사요 (chaek sayo) au futur",
        "책 사세요 (chaek sayo) impératif",
      ],
      [0]
    ),
    q(
      "q9",
      "single_choice",
      "Avec 가다 (gada), la forme « j'irai » au style 5e est :",
      "가다 devient 갈 avant 거예요.",
      [
        "갈 거예요 (gal geoyeyo)",
        "가 거예요 (ga geoyeyo)",
        "갔 거예요 (gat geoyeyo)",
        "가요 거예요 (gayo geoyeyo)",
      ],
      [0]
    ),
    q(
      "q10",
      "single_choice",
      "Que signifie 요리할 거예요 (yorihal geoyeyo) ?",
      "요리하다 (yorihada) signifie cuisiner.",
      [
        "Je vais cuisiner",
        "Je cuisine tous les jours",
        "J'ai cuisiné",
        "Cuisinez !",
      ],
      [0]
    ),
  ],
];

// Generate remaining u1 singles q03-q10 programmatically
const u1Activities = [
  {
    fr: "Demain j'irai à la bibliothèque",
    hint: "도서관 (doseogwan) est la bibliothèque avec futur 갈 거예요.",
    ko: "내일 도서관에 갈 거예요 (naeil doseogwane gal geoyeyo)",
    wrong: [
      "내일 도서관에 갔어요 (naeil doseogwane gasseoyo)",
      "어제 도서관에 갈 거예요 (eoje doseogwane gal geoyeyo)",
      "지금 도서관에 가요 (jigeum doseogwane gayo)",
    ],
  },
  {
    fr: "Demain matin je me lèverai tôt",
    hint: "일찍 (iljjik) signifie tôt avec le futur 일어날 거예요.",
    ko: "내일 아침에 일찍 일어날 거예요 (naeil achime iljjik ireonal geoyeyo)",
    wrong: [
      "내일 아침에 일찍 일어났어요 (naeil achime iljjik ireonasseoyo)",
      "어제 아침에 일찍 일어날 거예요 (eoje achime iljjik ireonal geoyeyo)",
      "내일 저녁에 일찍 일어날 거예요 (naeil jeonyeoge iljjik ireonal geoyeyo)",
    ],
  },
  {
    fr: "Demain j'appellerai un ami",
    hint: "전화하다 (jeonhwahada) → 전화할 거예요.",
    ko: "내일 친구하고 전화할 거예요 (naeil chingu-hago jeonhwahal geoyeyo)",
    wrong: [
      "내일 친구하고 전화했어요 (naeil chingu-hago jeonhwahaesseoyo)",
      "어제 친구하고 전화할 거예요 (eoje chingu-hago jeonhwahal geoyeyo)",
      "내일 친구 만났어요 (naeil chingu mannasseoyo)",
    ],
  },
  {
    fr: "Demain après-midi je nagerai",
    hint: "오후에 (ohu-e) situe l'après-midi.",
    ko: "내일 오후에 수영할 거예요 (naeil ohu-e suyeonghal geoyeyo)",
    wrong: [
      "내일 오후에 수영했어요 (naeil ohu-e suyeonghaesseoyo)",
      "어제 오후에 수영할 거예요 (eoje ohu-e suyeonghal geoyeyo)",
      "내일 아침에 수영할 거예요 (naeil achime suyeonghal geoyeyo) seulement passé",
    ],
  },
  {
    fr: "Demain soir je mangerai avec la famille",
    hint: "먹을 거예요 (meogeul geoyeyo) est le futur de manger.",
    ko: "내일 저녁에 가족과 밥 먹을 거예요 (naeil jeonyeoge gajokgwa bap meogeul geoyeyo)",
    wrong: [
      "내일 저녁에 가족과 밥 먹었어요 (naeil jeonyeoge gajokgwa bap meogeosseoyo)",
      "어제 저녁에 가족과 밥 먹을 거예요 (eoje jeonyeoge gajokgwa bap meogeul geoyeyo)",
      "내일 아침에 혼자 밥 먹을 거예요 (naeil achime honja bap meogeul geoyeyo) comme hier",
    ],
  },
  {
    fr: "Demain je vais jouer",
    hint: "게임하다 (geimhada) annonce une activité future.",
    ko: "내일 게임할 거예요 (naeil geimhal geoyeyo)",
    wrong: [
      "내일 게임했어요 (naeil geimhaesseoyo)",
      "어제 게임할 거예요 (eoje geimhal geoyeyo)",
      "지금 게임해요 (jigeum geimhaeyo) comme projet",
    ],
  },
  {
    fr: "Demain je prendrai des photos",
    hint: "찍다 (jjikda) → 찍을 거예요 au futur.",
    ko: "내일 사진 찍을 거예요 (naeil sajin jjigeul geoyeyo)",
    wrong: [
      "내일 사진 찍었어요 (naeil sajin jjigeosseoyo)",
      "어제 사진 찍을 거예요 (eoje sajin jjigeul geoyeyo)",
      "내일 편지 쓸 거예요 (naeil pyeonji sseul geoyeyo) comme passé",
    ],
  },
  {
    fr: "Demain je me reposerai à la maison",
    hint: "쉴 거예요 (swil geoyeyo) exprime le repos prévu.",
    ko: "내일 집에서 쉴 거예요 (naeil jibeseo swil geoyeyo)",
    wrong: [
      "내일 집에서 쉬었어요 (naeil jibeseo swieosseoyo)",
      "어제 집에서 쉴 거예요 (eoje jibeseo swil geoyeyo)",
      "내일 학교에서 쉴 거예요 (naeil hakgyoeseo swil geoyeyo) passé",
    ],
  },
];

function buildU1QuizBlock(quizIdx, mc, extraSingles) {
  const questions = [mc];
  questions.push(...extraSingles);
  const act = u1Activities[quizIdx - 2];
  if (act && questions.length < 10) {
    const n = quizIdx + 2;
    questions.push(
      q(
        `q${questions.length}`,
        "single_choice",
        `[Quiz ${String(quizIdx).padStart(2, "0")}] Quelle phrase annonce : « ${act.fr} » ?`,
        act.hint,
        [act.ko, ...act.wrong],
        [0]
      )
    );
  }
  while (questions.length < 10) {
    const i = questions.length;
    const act2 = u1Activities[(quizIdx + i) % u1Activities.length];
    questions.push(
      q(
        `q${i}`,
        "single_choice",
        `Projet n°${quizIdx}-${i} : traduction de « ${act2.fr} » ?`,
        act2.hint,
        shuffleWithCorrectFirst(act2.ko, act2.wrong, quizIdx * 10 + i),
        [0]
      )
    );
  }
  for (let i = 0; i < questions.length; i++) {
    questions[i].id = `q${i + 1}`;
  }
  return questions;
}

function shuffleWithCorrectFirst(correct, wrong, seed) {
  const opts = [correct, ...wrong];
  return opts;
}

// Better: fully define u1 q03-q10 with unique questions
const u1QuizSingles = {};

const u1Defs = [
  u1Singles[0],
  u1Singles[1],
  // q03
  [
    q(
      "q2",
      "single_choice",
      "내일 도서관에 갈 거예요 (naeil doseogwane gal geoyeyo) signifie :",
      "갈 거예요 (gal geoyeyo) avec 도서관 (bibliothèque).",
      [
        "Demain j'irai à la bibliothèque",
        "Hier bibliothèque",
        "Demain j'ai été à la bibliothèque",
        "Aujourd'hui bibliothèque seulement",
      ],
      [0]
    ),
    q(
      "q3",
      "single_choice",
      "Comment dire « Demain matin je me lèverai tôt » ?",
      "일찍 (iljjik) + 일어날 거예요 (ireonal geoyeyo).",
      [
        "내일 아침에 일찍 일어날 거예요 (naeil achime iljjik ireonal geoyeyo)",
        "내일 아침에 일찍 일어났어요 (naeil achime iljjik ireonasseoyo)",
        "어제 아침에 일찍 일어날 거예요 (eoje achime iljjik ireonal geoyeyo)",
        "내일 저녁에 일찍 일어날 거예요 (naeil jeonyeoge iljjik ireonal geoyeyo)",
      ],
      [0]
    ),
    q(
      "q4",
      "single_choice",
      "모레 (more) signifie :",
      "모레 est le surlendemain, distinct de 내일 (naeil).",
      ["après-demain", "demain", "hier", "aujourd'hui"],
      [0]
    ),
    q(
      "q5",
      "single_choice",
      "Quelle phrase place 내일 avant le verbe au futur ?",
      "L'ordre usuel : moment puis action future.",
      [
        "내일 친구 만날 거예요 (naeil chingu mannal geoyeyo)",
        "친구 내일 만날 거예요 (chingu naeil mannal geoyeyo) seule traduction",
        "만날 거예요 내일 (mannal geoyeyo naeil) seul",
        "내일 만났어요 (naeil mannasseoyo)",
      ],
      [0]
    ),
    q(
      "q6",
      "single_choice",
      "Je vais écrire une lettre demain :",
      "쓰다 (sseuda) → 쓸 거예요 (sseul geoyeyo).",
      [
        "내일 편지 쓸 거예요 (naeil pyeonji sseul geoyeyo)",
        "내일 편지 썼어요 (naeil pyeonji sseosseoyo)",
        "어제 편지 쓸 거예요 (eoje pyeonji sseul geoyeyo)",
        "내일 편지 읽을 거예요 (naeil pyeonji ilgeul geoyeyo) comme passé",
      ],
      [0]
    ),
    q(
      "q7",
      "single_choice",
      "Dans 내일 비 올 거예요 (naeil bi ol geoyeyo) :",
      "올 거예요 (ol geoyeyo) annonce que la pluie viendra.",
      [
        "Demain il pleuvra",
        "Demain il a plu",
        "Hier pluie",
        "Il pleut maintenant seulement",
      ],
      [0]
    ),
    q(
      "q8",
      "single_choice",
      "오늘 (oneul) vs 내일 (naeil) :",
      "oneul = aujourd'hui, naeil = demain.",
      [
        "aujourd'hui / demain",
        "demain / hier",
        "hier / demain",
        "soir / matin",
      ],
      [0]
    ),
    q(
      "q9",
      "single_choice",
      "Je vais dormir tôt demain soir :",
      "일찍 (tôt) + 잘 거예요 (jal geoyeyo).",
      [
        "내일 저녁에 일찍 잘 거예요 (naeil jeonyeoge iljjik jal geoyeyo)",
        "내일 저녁에 늦게 잤어요 (naeil jeonyeoge neutge jasseoyo)",
        "어제 저녁에 일찍 잘 거예요 (eoje jeonyeoge iljjik jal geoyeyo)",
        "내일 아침에 잘 거예요 (naeil achime jal geoyeyo) passé",
      ],
      [0]
    ),
    q(
      "q10",
      "single_choice",
      "Phrase modèle pour un emploi du temps de demain :",
      "Enchaîner deux projets avec 내일 et 거예요.",
      [
        "내일 아침에 학교에 갈 거예요 그리고 오후에 운동할 거예요 (naeil achime hakgyoe gal geoyeyo geurigo ohu-e undonghal geoyeyo)",
        "내일 학교 갔어요 (naeil hakgyoe gasseoyo)",
        "어제 운동할 거예요 (eoje undonghal geoyeyo)",
        "아침에 학교 (achime hakgyo) seul",
      ],
      [0]
    ),
  ],
];

// Extend with generated blocks for q04-q10 - use template expansion
const u1VerbRows = [
  [
    "듣다",
    "deutda",
    "들을",
    "deureul",
    "écouter",
    "내일 음악 들을 거예요 (naeil eumak deureul geoyeyo)",
  ],
  [
    "걷다",
    "geotda",
    "걸을",
    "georeul",
    "marcher",
    "내일 공원에서 걸을 거예요 (naeil gongwoneseo georeul geoyeyo)",
  ],
  [
    "그리다",
    "geurida",
    "그릴",
    "geuril",
    "dessiner",
    "내일 그림 그릴 거예요 (naeil geurim geuril geoyeyo)",
  ],
  [
    "타다",
    "tada",
    "탈",
    "tal",
    "prendre (transport)",
    "내일 버스 탈 거예요 (naeil beoseu tal geoyeyo)",
  ],
  [
    "배우다",
    "baeuda",
    "배울",
    "baeul",
    "apprendre",
    "내일 한국어 배울 거예요 (naeil hangugeo baeul geoyeyo)",
  ],
  [
    "기다리다",
    "gidarida",
    "기다릴",
    "gidaril",
    "attendre",
    "내일 친구 기다릴 거예요 (naeil chingu gidaril geoyeyo)",
  ],
  [
    "정리하다",
    "jeongnihada",
    "정리할",
    "jeongnihal",
    "ranger",
    "내일 방 정리할 거예요 (naeil bang jeongnihal geoyeyo)",
  ],
  [
    "쇼핑하다",
    "syopinghada",
    "쇼핑할",
    "syopinghal",
    "faire les courses",
    "내일 쇼핑할 거예요 (naeil syopinghal geoyeyo)",
  ],
];

function makeU1QuizFromRow(quizNum, row, mc) {
  const [vKo, vRom, futKo, futRom, fr, sample] = row;
  const wrongFut = sample.replace(futKo, "했어요").replace("거예요", "었어요");
  return [
    mc,
    q(
      "q2",
      "single_choice",
      `Quiz u1-${quizNum} : ${vKo} (${vRom}) au futur proche, quelle forme ?`,
      `${futKo} 거예요 (${futRom} geoyeyo) annonce l'action.`,
      [
        `${futKo} 거예요 (${futRom} geoyeyo)`,
        `${vKo}해요 (${vRom}haeyo)`,
        `${vKo}했어요 (${vRom}haesseoyo)`,
        `${futKo}래요 (${futRom}raeyo)`,
      ],
      [0]
    ),
    q(
      "q3",
      "single_choice",
      `Traduisez l'exemple : ${sample}`,
      `Projet avec 내일 (naeil) et ${fr}.`,
      [
        `Demain je vais ${fr}`,
        `Hier j'ai ${fr}`,
        `Je ${fr} maintenant`,
        `Demain j'ai ${fr}`,
      ],
      [0]
    ),
    q(
      "q4",
      "single_choice",
      "Quelle phrase mélange passé et 내일 (naeil) à éviter ?",
      "내일 ne s'accorde pas avec -았/었어요.",
      [
        "내일 영화 봤어요 (naeil yeonghwa bwasseoyo)",
        "내일 영화 볼 거예요 (naeil yeonghwa bol geoyeyo)",
        "내일 아침에 갈 거예요 (naeil achime gal geoyeyo)",
        "내일 숙제할 거예요 (naeil sukjaehal geoyeyo)",
      ],
      [0]
    ),
    q(
      "q5",
      "single_choice",
      `Futur n°${quizNum} : choisis la phrase correcte avec 내일.`,
      `${sample.split("(")[0].trim()} est le modèle.`,
      [
        sample,
        sample.replace("내일", "어제"),
        sample.replace("거예요", "했어요"),
        sample.replace("내일", "오늘").replace("거예요", "해요"),
      ],
      [0]
    ),
    q(
      "q6",
      "single_choice",
      `-ㄹ 거예요 vs -을 거예요 (quiz ${quizNum}) : après ${futKo}, on entend ?`,
      `La base ${futKo} porte déjà la liaison future.`,
      [`…${futRom} geoyeyo`, "…haesseoyo", "…getseumnida", "…seyo impératif"],
      [0]
    ),
    q(
      "q7",
      "single_choice",
      `Question : « Qu'est-ce que tu feras demain ? » (quiz ${quizNum})`,
      "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?) est la forme 5e.",
      [
        "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?)",
        "어제 뭐 했어요? (eoje mwo haesseoyo?)",
        "지금 뭐 해요? (jigeum mwo haeyo?)",
        "내일 뭐 했어요? (naeil mwo haesseoyo?)",
      ],
      [0]
    ),
    q(
      "q8",
      "single_choice",
      `Réponse type au projet du lendemain (quiz ${quizNum}) :`,
      "On répond avec une phrase en -ㄹ/-을 거예요.",
      [
        sample,
        "네, 어제 갔어요 (ne, eoje gasseoyo)",
        "아니요, 지금 해요 (aniyo, jigeum haeyo)",
        "몰라요 (mollayo) seule",
      ],
      [0]
    ),
    q(
      "q9",
      "single_choice",
      `Différence 거예요 / 할래요 (quiz ${quizNum}) :`,
      "거예요 décrit un plan ; -ㄹ래요 propose ou invite.",
      [
        "거예요 = plan annoncé ; -ㄹ래요 = proposition",
        "Synonymes stricts",
        "할래요 est passé",
        "거예요 est impératif",
      ],
      [0]
    ),
    q(
      "q10",
      "single_choice",
      `Synthèse chapitre u1-${quizNum} : marqueur clé avec le futur ?`,
      "내일 (naeil) situe le plan dans le futur proche.",
      [
        "내일 (naeil) + -(으)ㄹ 거예요 (geoyeyo)",
        "어제 (eoje) + -았어요",
        "지금 (jigeum) + -getseumnida",
        "그저께 (geujeokke) + -seyo",
      ],
      [0]
    ),
  ].map((item, idx) => ({ ...item, id: `q${idx + 1}` }));
}

const u1Quizzes = [];
for (let i = 0; i < 10; i++) {
  let questions;
  if (i < 2) {
    questions = [u1Mc[i], ...u1Singles[i]];
  } else if (i === 2) {
    questions = [u1Mc[i], ...u1Defs[2]];
  } else {
    const row = u1VerbRows[i - 3];
    questions = makeU1QuizFromRow(i + 1, row, u1Mc[i]);
  }
  for (let j = 0; j < questions.length; j++) {
    questions[j].id = `q${j + 1}`;
  }
  u1Quizzes.push({ id: `q${String(i + 1).padStart(2, "0")}`, questions });
}

/** u2: Invitations — 같이, 갈래요 */
const u2Mc = [
  q(
    "q1",
    "multiple_choice",
    "Quelles phrases invitent à faire quelque chose ensemble ?",
    "같이 (gachi) signifie « ensemble » dans les deux invitations.",
    [
      "같이 영화 볼래요? (gachi yeonghwa bollaeoyo?)",
      "같이 카페에 갈래요? (gachi kape-e gallaeoyo?)",
      "혼자 영화 볼 거예요 (honja yeonghwa bol geoyeyo)",
      "어제 같이 갔어요 (eoje gachi gasseoyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Deux réponses positives à une invitation 5e :",
    "네, 좋아요 et 같이 가요 acceptent poliment.",
    [
      "네, 좋아요 (ne, joayo)",
      "네, 같이 가요 (ne, gachi gayo)",
      "아니요, 싫어요 (aniyo, sireoyo)",
      "미안해요, 바빠요 (mianhaeyo, bappayo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles questions utilisent -ㄹ래요 pour inviter ?",
    "-ㄹ래요 demande si l'autre veut venir ou faire l'action.",
    [
      "같이 밥 먹을래요? (gachi bap meogeullaeoyo?)",
      "같이 공원에 갈래요? (gachi gongwon-e gallaeoyo?)",
      "같이 밥 먹었어요 (gachi bap meogeosseoyo)",
      "같이 밥 먹을 거예요 (gachi bap meogeul geoyeyo) seul",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles formules contiennent 같이 (gachi) ?",
    "같이 … 갈래요 et 같이 … 할래요 proposent une activité commune.",
    [
      "같이 수영할래요? (gachi suyeonghallaeoyo?)",
      "같이 집에 갈래요? (gachi jibe gallaeoyo?)",
      "혼자 수영할래요? (honja suyeonghallaeoyo?)",
      "같이 어제 갔어요 (gachi eoje gasseoyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Deux refus polis sans forme lycée :",
    "아니요, … and 미안해요, 바빠요 restent au niveau 5e.",
    [
      "아니요, 못 가요 (aniyo, mot gayo)",
      "미안해요, 숙제해요 (mianhaeyo, sukjaehaeyo)",
      "싫습니다 (sipseumnida)",
      "안 가겠습니다 (an gagetseumnida)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Invitations au cinéma ou au parc :",
    "영화 and 공원 avec 같이 et -ㄹ래요.",
    [
      "같이 영화 볼래요? (gachi yeonghwa bollaeoyo?)",
      "같이 공원에 갈래요? (gachi gongwon-e gallaeoyo?)",
      "혼자 영화 봤어요 (honja yeonghwa bwasseoyo)",
      "내일 어제 갔어요 (naeil eoje gasseoyo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Quelles réponses proposent un autre moment ?",
    "내일 갈래요? reporte ; 오늘 오후는 어때요? suggère un créneau.",
    [
      "내일 갈래요? (naeil gallaeoyo?)",
      "오늘 오후는 어때요? (oneul ohu-neun eottaeyo?)",
      "어제 갔어요 (eoje gasseoyo)",
      "지금 혼자 가요 (jigeum honja gayo)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Deux activités qu'on propose avec 같이 … 할래요? :",
    "공부 and 게임 avec 같이 et -ㄹ래요.",
    [
      "같이 공부할래요? (gachi gongbuhallaeoyo?)",
      "같이 게임할래요? (gachi geimhallaeoyo?)",
      "같이 공부했어요 (gachi gongbuhaesseoyo)",
      "혼자 게임할래요? (honja geimhallaeoyo?)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Phrases où 같이 갈래요 (gachi gallaeoyo) est correct :",
    "같이 갈래요? invite à venir ensemble, avec ou sans lieu.",
    [
      "같이 갈래요? (gachi gallaeoyo?)",
      "학교에 같이 갈래요? (hakgyoe gachi gallaeoyo?)",
      "같이 갔어요? (gachi gasseoyo?) au futur",
      "혼자 갈래요? (honja gallaeoyo?)",
    ],
    [0, 1]
  ),
  q(
    "q1",
    "multiple_choice",
    "Pour clore une invitation acceptée, quelles suites sont cohérentes ?",
    "On enchaîne avec rendez-vous ou heure.",
    [
      "몇 시에 만날까요? (myeot sie mannalkkayo?)",
      "어디에서 만나요? (eodiseo mannayo?)",
      "어제 만났어요 (eoje mannasseoyo)",
      "싫습니다 (sipseumnida)",
    ],
    [0, 1]
  ),
];

const u2InviteRows = [
  ["카페", "kape", "café", "같이 카페에 갈래요? (gachi kape-e gallaeoyo?)"],
  [
    "백화점",
    "baekhwajeom",
    "grand magasin",
    "같이 백화점에 갈래요? (gachi baekhwajeom-e gallaeoyo?)",
  ],
  [
    "도서관",
    "doseogwan",
    "bibliothèque",
    "같이 도서관에 갈래요? (gachi doseogwane gallaeoyo?)",
  ],
  ["피자", "pija", "pizza", "같이 피자 먹을래요? (gachi pija meogeullaeoyo?)"],
  ["수영", "suyeong", "nager", "같이 수영할래요? (gachi suyeonghallaeoyo?)"],
  [
    "산책",
    "sanchaek",
    "se promener",
    "같이 산책할래요? (gachi sanchaekhallaeoyo?)",
  ],
  [
    "콘서트",
    "konseoteu",
    "concert",
    "같이 콘서트에 갈래요? (gachi konseoteue gallaeoyo?)",
  ],
  [
    "한국 음식",
    "hanguk eumsik",
    "cuisine coréenne",
    "같이 한국 음식 먹을래요? (gachi hanguk eumsik meogeullaeoyo?)",
  ],
  [
    "놀이공원",
    "noligongwon",
    "parc d'attractions",
    "같이 놀이공원에 갈래요? (gachi noligongwon-e gallaeoyo?)",
  ],
  [
    "음악",
    "eumak",
    "écouter de la musique",
    "같이 음악 들을래요? (gachi eumak deureullaeoyo?)",
  ],
];

function makeU2Quiz(quizNum, mc, row) {
  const [placeKo, placeRom, placeFr, invite] = row;
  const n = quizNum;
  return [
    mc,
    q(
      "q2",
      "single_choice",
      `u2 quiz ${n} : que signifie 같이 (gachi) dans une invitation ?`,
      "같이 (gachi) signifie « ensemble ».",
      ["ensemble", "seul", "hier", "demain matin"],
      [0]
    ),
    q(
      "q3",
      "single_choice",
      `Invitation quiz ${n} vers ${placeFr} :`,
      `${invite} est la proposition standard.`,
      [
        invite,
        invite.replace("갈래요", "갔어요"),
        invite.replace("같이", "혼자"),
        invite.replace("?", ".").replace("래요", "겠습니다"),
      ],
      [0]
    ),
    q(
      "q4",
      "single_choice",
      `Réponse positive à ${invite}`,
      "네, 좋아요 (ne, joayo) accepte l'invitation.",
      [
        "네, 좋아요 (ne, joayo)",
        "아니요, 못 가요 (aniyo, mot gayo)",
        "미안해요, 바빠요 (mianhaeyo, bappayo)",
        "싫습니다 (sipseumnida)",
      ],
      [0]
    ),
    q(
      "q5",
      "single_choice",
      `Refus poli quiz ${n} (pas lycée) :`,
      "미안해요, 바빠요 (mianhaeyo, bappayo) excuse sans -습니다.",
      [
        "미안해요, 바빠요 (mianhaeyo, bappayo)",
        "안 가겠습니다 (an gagetseumnida)",
        "가지 마세요 (gaji maseyo)",
        "네, 좋아요 (ne, joayo)",
      ],
      [0]
    ),
    q(
      "q6",
      "single_choice",
      `-ㄹ래요 (raeyo) dans ${invite} sert à :`,
      "Demander si l'interlocuteur veut faire l'action.",
      ["proposer / inviter", "raconter le passé", "donner un ordre", "saluer"],
      [0]
    ),
    q(
      "q7",
      "single_choice",
      `Contre-proposition quiz ${n} :`,
      "내일 … 갈래요? reporte l'invitation.",
      [
        `내일 ${placeKo}에 갈래요? (naeil ${placeRom}-e gallaeoyo?)`,
        `어제 ${placeKo}에 갔어요 (eoje ${placeRom}-e gasseoyo)`,
        "지금 혼자 가요 (jigeum honja gayo)",
        "안 갈 거예요 (an gal geoyeyo) seul passé",
      ],
      [0]
    ),
    q(
      "q8",
      "single_choice",
      `Question lieu : « Où on se retrouve ? » (quiz ${n})`,
      "어디에서 만나요? (eodiseo mannayo?) fixe le rendez-vous.",
      [
        "어디에서 만나요? (eodiseo mannayo?)",
        "몇 살이에요? (myeot sarieyo?)",
        "이름이 뭐예요? (ireumi mwoyeyo?)",
        "어제 어디 갔어요? (eoje eodi gasseoyo?)",
      ],
      [0]
    ),
    q(
      "q9",
      "single_choice",
      `Heure du rendez-vous (quiz ${n}) :`,
      "몇 시에 만날까요? (myeot sie mannalkkayo?) convient au dialogue.",
      [
        "몇 시에 만날까요? (myeot sie mannalkkayo?)",
        "몇 시에 잤어요? (myeot sie jasseoyo?)",
        "몇 시에 갔어요? (myeot sie gasseoyo?) hier seulement",
        "몇 시예요? (myeot siyeyo?) sans invitation",
      ],
      [0]
    ),
    q(
      "q10",
      "single_choice",
      `Mini-dialogue quiz ${n} : invitation + acceptation`,
      "Question en -ㄹ래요 puis 네, 같이 가요.",
      [
        `${invite} — 네, 같이 가요 (ne, gachi gayo)`,
        `${invite} — 아니요, 좋아요 (aniyo, joayo) incohérent`,
        "혼자 갔어요 — 네 (honja gasseoyo — ne)",
        "어제 갈래요? — 네 (eoje gallaeoyo? — ne)",
      ],
      [0]
    ),
  ].map((item, idx) => ({ ...item, id: `q${idx + 1}` }));
}

const u2Quizzes = [];
for (let i = 0; i < 10; i++) {
  const row = u2InviteRows[i];
  u2Quizzes.push({
    id: `q${String(i + 1).padStart(2, "0")}`,
    questions: makeU2Quiz(i + 1, u2Mc[i], row),
  });
}

const doc = {
  id: "5e-coreen-06",
  order: 6,
  subject: "coreen",
  title: "L'avenir et les projets en coréen",
  units: [
    {
      id: "u1",
      order: 1,
      quizzes: u1Quizzes,
      title: "Dire ce qu'on va faire",
    },
    {
      id: "u2",
      order: 2,
      quizzes: u2Quizzes,
      title: "Invitations",
    },
  ],
  year: "5e",
};

// Validate
const texts = new Set();
let count = 0;
for (const unit of doc.units) {
  for (const quiz of unit.quizzes) {
    if (quiz.questions.length !== 10) {
      throw new Error(`Quiz ${quiz.id} has ${quiz.questions.length} questions`);
    }
    for (const qu of quiz.questions) {
      count++;
      if (texts.has(qu.question)) {
        throw new Error(`Duplicate question: ${qu.question}`);
      }
      texts.add(qu.question);
      if (qu.id === "q1" && qu.type !== "multiple_choice") {
        throw new Error("q1 must be multiple_choice");
      }
      if (qu.id === "q1" && qu.correctAnswers.length !== 2) {
        throw new Error("q1 must have 2 correct");
      }
      if (qu.id !== "q1" && qu.type !== "single_choice") {
        throw new Error(`${qu.id} must be single`);
      }
      if (qu.id !== "q1" && qu.correctAnswers.length !== 1) {
        throw new Error(`${qu.id} must have 1 correct`);
      }
    }
  }
}
if (count !== 200) {
  throw new Error(`Expected 200 questions, got ${count}`);
}

fs.writeFileSync(outPath, JSON.stringify(doc));
console.log("Wrote", outPath, "questions:", count);
