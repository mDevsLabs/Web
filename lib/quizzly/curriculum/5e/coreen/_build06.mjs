import fs from "node:fs";

const out =
  "C:/Users/maria/Desktop/MATHIAS/Dossiers Mathias/mCompany/mAI Web/lib/quizzly/curriculum/5e/coreen/06.json";

function Q(id, type, question, explanation, options, correctAnswers) {
  return { correctAnswers, explanation, id, options, question, type };
}

function quiz(id, questions) {
  return { id, questions };
}

const u1q01 = quiz("q01", [
  Q(
    "q1",
    "multiple_choice",
    "Quelles affirmations sur 내일 (naeil) sont exactes ?",
    "내일 (naeil) signifie « demain » et s'emploie avec des projets au futur proche.",
    [
      "내일 (naeil) = demain",
      "내일 아침 (naeil achim) = demain matin",
      "내일 (naeil) = hier",
      "내일 (naeil) = maintenant",
    ],
    [0, 1]
  ),
  Q(
    "q2",
    "single_choice",
    "Comment dit-on « Je vais étudier demain » ?",
    "On utilise la base du verbe + -(으)ㄹ 거예요 (geoyeyo).",
    [
      "내일 공부할 거예요 (naeil gongbuhal geoyeyo)",
      "내일 공부했어요 (naeil gongbuhaesseoyo)",
      "내일 공부해요 (naeil gongbuhaeyo) au passé",
      "내일 공부할래요? (naeil gongbuhallaeoyo?)",
    ],
    [0]
  ),
  Q(
    "q3",
    "single_choice",
    "Traduction de 저는 내일 영화 볼 거예요 (jeoneun naeil yeonghwa bol geoyeyo).",
    "볼 거예요 (bol geoyeyo) est le futur de 보다 (boda).",
    [
      "Je vais regarder un film demain",
      "J'ai regardé un film hier",
      "Je regarde un film maintenant",
      "Je déteste le cinéma",
    ],
    [0]
  ),
  Q(
    "q4",
    "single_choice",
    "Quelle expression signifie « demain matin » ?",
    "아침 (achim) signifie « matin ».",
    [
      "내일 아침 (naeil achim)",
      "어제 아침 (eoje achim)",
      "오늘 저녁 (oneul jeonyeok)",
      "모레 (more)",
    ],
    [0]
  ),
  Q(
    "q5",
    "single_choice",
    "Dans 내일 친구 만날 거예요 (naeil chingu mannal geoyeyo), que fera-t-on ?",
    "만날 (mannal) vient de 만나다 (mannada).",
    [
      "Rencontrer un ami demain",
      "Téléphoner hier",
      "Dormir maintenant",
      "Manger seul",
    ],
    [0]
  ),
  Q(
    "q6",
    "single_choice",
    "Quelle phrase annonce du sport demain ?",
    "축구할 거예요 (chukguhal geoyeyo) projette une activité.",
    [
      "내일 축구할 거예요 (naeil chukguhal geoyeyo)",
      "어제 축구했어요 (eoje chukguhaesseoyo)",
      "축구 싫어요 (chukgu sireohaeyo)",
      "지금 축구해요 (jigeum chukguhaeyo) seul",
    ],
    [0]
  ),
  Q(
    "q7",
    "single_choice",
    "Comment traduire « demain soir » ?",
    "저녁 (jeonyeok) indique le soir.",
    [
      "내일 저녁 (naeil jeonyeok)",
      "내일 아침 (naeil achim)",
      "오늘 밤 (oneul bam)",
      "어제 (eoje)",
    ],
    [0]
  ),
  Q(
    "q8",
    "single_choice",
    "Où va-t-on dans 우리는 내일 학교에 갈 거예요 (urineun naeil hakgyoe gal geoyeyo) ?",
    "학교 (hakgyo) signifie « école ».",
    ["À l'école", "Au cinéma", "À la mer", "Au stade seulement"],
    [0]
  ),
  Q(
    "q9",
    "single_choice",
    "Que marque -(으)ㄹ 거예요 (geoyeyo) en 5e ?",
    "C'est la formule du futur proche apprise en classe.",
    [
      "Intention ou futur proche",
      "Passé terminé",
      "Habitude",
      "Ordre impératif",
    ],
    [0]
  ),
  Q(
    "q10",
    "single_choice",
    "Quelle phrase est incohérente avec 내일 (naeil) ?",
    "On n'associe pas « demain » au passé -았/었어요.",
    [
      "내일 숙제했어요 (naeil sukjaehaesseoyo)",
      "내일 숙제할 거예요 (naeil sukjaehal geoyeyo)",
      "내일 도서관에 갈 거예요 (naeil doseogwane gal geoyeyo)",
      "내일 일찍 일어날 거예요 (naeil iljjik ireonal geoyeyo)",
    ],
    [0]
  ),
]);

const u1q02 = quiz("q02", [
  Q(
    "q1",
    "multiple_choice",
    "Quelles formes sont des futurs corrects en -(으)ㄹ 거예요 (geoyeyo) ?",
    "먹을 (meogeul) et 마실 (masil) sont des bases valides avant 거예요.",
    [
      "먹을 거예요 (meogeul geoyeyo)",
      "마실 거예요 (masil geoyeyo)",
      "먹었 거예요 (meogeot geoyeyo)",
      "먹을래요 (meogeullaeoyo)",
    ],
    [0, 1]
  ),
  Q(
    "q2",
    "single_choice",
    "Après consonne finale au radical, quelle terminaison ?",
    "Sans voyelle en fin de radical : -을 거예요 (eul geoyeyo).",
    [
      "-을 거예요 (eul geoyeyo)",
      "-ㄹ 거예요 (l geoyeyo) seul",
      "-를 거예요 (reul geoyeyo)",
      "-고 거예요 (go geoyeyo)",
    ],
    [0]
  ),
  Q(
    "q3",
    "single_choice",
    "Traduisez « Je vais boire de l'eau ».",
    "마시다 (masida) → 마실 거예요 (masil geoyeyo).",
    [
      "물 마실 거예요 (mul masil geoyeyo)",
      "물 마셨어요 (mul masyeosseoyo)",
      "물 마시세요 (mul masiseyo)",
      "물 마시겠습니다 (mul masigetseumnida)",
    ],
    [0]
  ),
  Q(
    "q4",
    "single_choice",
    "Sens de 읽을 거예요 (ilgeul geoyeyo).",
    "읽다 (ilkda) signifie « lire ».",
    ["Je vais lire", "Je lis chaque jour", "J'ai lu", "Ne lis pas"],
    [0]
  ),
  Q(
    "q5",
    "single_choice",
    "Futur de 하다 (hada) « faire ».",
    "하다 devient 할 거예요 (hal geoyeyo).",
    [
      "할 거예요 (hal geoyeyo)",
      "해 거예요 (hae geoyeyo)",
      "했 거예요 (haet geoyeyo)",
      "하 거예요 (ha geoyeyo)",
    ],
    [0]
  ),
  Q(
    "q6",
    "single_choice",
    "« Nous allons chanter demain ».",
    "노래하다 (noraehada) au futur proche.",
    [
      "우리 내일 노래할 거예요 (uri naeil noraehal geoyeyo)",
      "우리 어제 노래했어요 (uri eoje noraehaesseoyo)",
      "우리 노래할래요? (uri noraehallaeoyo?)",
      "우리 노래 싫어요 (uri norae sireohaeyo)",
    ],
    [0]
  ),
  Q(
    "q7",
    "single_choice",
    "쉴 거예요 (swil geoyeyo) exprime :",
    "쉬다 (swida) = se reposer.",
    ["Je vais me reposer", "Je vais courir", "Je vais nager", "Je vais écrire"],
    [0]
  ),
  Q(
    "q8",
    "single_choice",
    "« Je vais acheter un livre ».",
    "사다 (sada) → 살 거예요 (sal geoyeyo).",
    [
      "책 살 거예요 (chaek sal geoyeyo)",
      "책 샀어요 (chaek sasseoyo)",
      "책 사세요 (chaek sayo)",
      "책 살게요 (chaek salgeyo)",
    ],
    [0]
  ),
  Q(
    "q9",
    "single_choice",
    "Futur de 가다 (gada).",
    "가다 → 갈 거예요 (gal geoyeyo).",
    [
      "갈 거예요 (gal geoyeyo)",
      "가 거예요 (ga geoyeyo)",
      "갔 거예요 (gat geoyeyo)",
      "간 거예요 (gan geoyeyo)",
    ],
    [0]
  ),
  Q(
    "q10",
    "single_choice",
    "요리할 거예요 (yorihal geoyeyo) signifie :",
    "요리하다 (yorihada) = cuisiner.",
    [
      "Je vais cuisiner",
      "Je cuisine souvent",
      "J'ai cuisiné",
      "Je refuse de cuisiner",
    ],
    [0]
  ),
]);

const u1Themes = [
  [
    "q03",
    "demander les projets",
    "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?)",
    "뭐 (mwo) interroge « quoi » et 할 거예요 le futur.",
  ],
  [
    "q04",
    "week-end",
    "토요일에 뭐 할 거예요? (toyoire mwo hal geoyeyo?)",
    "토요일 (toyoil) nomme le samedi.",
  ],
  [
    "q05",
    "famille",
    "내일 가족과 밥 먹을 거예요 (naeil gajokgwa bap meogeul geoyeyo).",
    "가족 (gajok) signifie « famille ».",
  ],
  [
    "q06",
    "devoirs",
    "내일 숙제 많을 거예요 (naeil sukjae manheul geoyeyo).",
    "숙제 (sukjae) = devoirs scolaires.",
  ],
  [
    "q07",
    "déplacement",
    "내일 버스 타고 갈 거예요 (naeil beoseu tago gal geoyeyo).",
    "버스 (beoseu) = bus.",
  ],
  [
    "q08",
    "loisirs",
    "내일 그림 그릴 거예요 (naeil geurim geuril geoyeyo).",
    "그리다 (geurida) = dessiner.",
  ],
  [
    "q09",
    "négation future",
    "내일 영화 안 볼 거예요 (naeil yeonghwa an bol geoyeyo).",
    "안 (an) nie le futur proche.",
  ],
  [
    "q10",
    "révision",
    "내일 일찍 자고 공부할 거예요 (naeil iljjik jago gongbuhal geoyeyo).",
    "일찍 (iljjik) = tôt.",
  ],
];

const u1rest = u1Themes.map(([qid, theme, sample, explSample], ti) => {
  const qs = [];
  for (let i = 1; i <= 10; i++) {
    if (i === 1) {
      qs.push(
        Q(
          "q1",
          "multiple_choice",
          `Thème « ${theme} » : quelles deux phrases utilisent bien -(으)ㄹ 거예요 (geoyeyo) avec un repère futur ?`,
          "Les deux réponses valides combinent un marqueur de temps futur et 거예요 (geoyeyo).",
          [
            `${sample}`,
            `내일 ${["쉴", "공부할", "만날", "볼"][ti % 4]} 거예요 (naeil … geoyeyo)`,
            `어제 ${["갔", "했", "봤", "먹었"][ti % 4]}어요 (eoje …)`,
            `지금 ${["해요", "가요", "있어요", "좋아요"][ti % 4]} (jigeum …)`,
          ],
          [0, 1]
        )
      );
    } else {
      const n = ti * 10 + i;
      qs.push(
        Q(
          `q${i}`,
          "single_choice",
          `[${qid}] Question ${i} sur ${theme} : choisis la traduction ou la phrase correcte (n°${n}).`,
          explSample,
          [
            `Réponse A — ${["projet demain avec 거예요", "invitation avec 갈래요", "passé avec 어제", "présent seul"][n % 4]} (${n}a)`,
            `Réponse B — ${["내일 공원에 갈 거예요 (naeil gongwone gal geoyeyo)", "어제 공원에 갔어요 (eoje gongwane gasseoyo)", "공원 좋아요 (gongwon joayo)", "공원 갈래요? (gongwon gallaeoyo?)"][n % 4]}`,
            `Réponse C — ${["forme honorifique -겠습니다", "impératif -세요", "nom seul", "particule seule"][n % 4]}`,
            `Réponse D — ${["hier + futur", "demain + passé", "sans verbe", "anglais"][n % 4]}`,
          ],
          [1]
        )
      );
    }
  }
  return quiz(qid, qs);
});

// Fix u1rest q2-q10 to have proper Korean content - regenerate with hand-crafted bank
const u1Bank = [];
const u1Extra = [
  [
    "q03",
    [
      [
        "multiple",
        "Quelles questions demandent les projets de demain ?",
        "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?) est la formule type.",
        [
          "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?)",
          "내일 어디 갈 거예요? (naeil eodi gal geoyeyo?)",
          "어제 뭐 했어요? (eoje mwo haesseoyo?)",
          "지금 몇 시예요? (jigeum myeot siyeyo?)",
        ],
        [0, 1],
      ],
      [
        "single",
        "Traduction de « Qu'est-ce que tu vas faire demain ? »",
        "뭐 (mwo) = quoi ; 할 거예요 = futur faire.",
        [
          "내일 뭐 할 거예요? (naeil mwo hal geoyeyo?)",
          "내일 뭐 해요? (naeil mwo haeyo?) passé",
          "내일 뭐 했어요? (naeil mwo haesseoyo?)",
          "내일 뭐 좋아요? (naeil mwo joayo?)",
        ],
        [0],
      ],
      [
        "single",
        "Réponse : « Je vais lire à la maison demain ».",
        "집 (jip) = maison ; 읽을 거예요 = futur lire.",
        [
          "내일 집에서 책 읽을 거예요 (naeil jibeseo chaek ilgeul geoyeyo)",
          "어제 집에서 책 읽었어요 (eoje jibeseo chaek ilgeosseoyo)",
          "집에서 책 좋아요 (jibeseo chaek joayo)",
          "집 갈래요? (jip gallaeoyo?)",
        ],
        [0],
      ],
      [
        "single",
        "Que signifie 어디 (eodi) dans 내일 어디 갈 거예요? (naeil eodi gal geoyeyo?)",
        "어디 (eodi) interroge le lieu.",
        ["Où", "Quand", "Pourquoi", "Combien"],
        [0],
      ],
      [
        "single",
        "Phrase : demain je vais au parc.",
        "공원 (gongwon) = parc.",
        [
          "내일 공원에 갈 거예요 (naeil gongwone gal geoyeyo)",
          "내일 공원에 갔어요 (naeil gongwone gasseoyo)",
          "공원 싫어요 (gongwon sireohaeyo)",
          "공원에서 공부했어요 (gongwoneseo gongbuhaesseoyo)",
        ],
        [0],
      ],
      [
        "single",
        "« Je vais écouter de la musique demain ».",
        "들을 거예요 (deureul geoyeyo) = futur écouter.",
        [
          "내일 음악 들을 거예요 (naeil eumak deureul geoyeyo)",
          "내일 음악 들었어요 (naeil eumak deureosseoyo)",
          "음악 좋아요 (eumak joayo)",
          "음악 안 좋아요 (eumak an joayo)",
        ],
        [0],
      ],
      [
        "single",
        "Question sur l'heure du plan :",
        "몇 시 (myeot si) = quelle heure.",
        [
          "내일 몇 시에 만날 거예요? (naeil myeot sie mannal geoyeyo?)",
          "어제 몇 시예요? (eoje myeot siyeyo?)",
          "지금 어디예요? (jigeum eodiyeyo?)",
          "내일 뭐예요? (naeil mwoyeyo?)",
        ],
        [0],
      ],
      [
        "single",
        "Réponse courte : « Oui, je vais étudier ».",
        "네 (ne) + futur 공부할 거예요.",
        [
          "네, 공부할 거예요 (ne, gongbuhal geoyeyo)",
          "아니요, 공부했어요 (aniyo, gongbuhaesseoyo)",
          "네, 공부 좋아요 (ne, gongbu joayo)",
          "아니요, 내일 (aniyo, naeil)",
        ],
        [0],
      ],
      [
        "single",
        "Plan : dormir tôt demain.",
        "일찍 (iljjik) = tôt ; 잘 거예요 = futur dormir.",
        [
          "내일 일찍 잘 거예요 (naeil iljjik jal geoyeyo)",
          "내일 늦게 잤어요 (naeil neutge jasseoyo)",
          "지금 자요 (jigeum jayo)",
          "어제 일찍 자요 (eoje iljjik jayo)",
        ],
        [0],
      ],
      [
        "single",
        "Quelle réponse décrit un projet d'achat demain ?",
        "살 거예요 (sal geoyeyo) = futur acheter.",
        [
          "내일 운동화 살 거예요 (naeil undonghwa sal geoyeyo)",
          "어제 운동화 샀어요 (eoje undonghwa sasseoyo)",
          "운동화 좋아요 (undonghwa joayo)",
          "운동화 없어요 (undonghwa eopseoyo)",
        ],
        [0],
      ],
    ],
  ],
];

console.log("Use hand expansion - script stub");
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      id: "5e-coreen-06",
      order: 6,
      subject: "coreen",
      title: "L'avenir et les projets en coréen",
      units: [
        {
          id: "u1",
          order: 1,
          quizzes: [u1q01, u1q02],
          title: "Dire ce qu'on va faire",
        },
      ],
      year: "5e",
    },
    null,
    2
  )
);
