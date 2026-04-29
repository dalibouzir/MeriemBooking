import type {
  MainTypeDefinition,
  MainTypeKey,
  QuizAnswers,
  QuizOption,
  QuizResult,
  ShadowOptionKey,
} from './types'

const PRIMARY_RANGE = { min: 1, max: 10 }
const SECONDARY_RANGE = { min: 16, max: 20 }
const SHADOW_RANGE = { min: 11, max: 15 }

const MAIN_WEIGHT = 0.6
const SECONDARY_WEIGHT = 0.4
const MIXED_DELTA_THRESHOLD = 0.1

const SHADOW_LABELS: Record<ShadowOptionKey, string> = {
  A: 'الناقدة الساخطة',
  B: 'المنصهرة',
  C: 'الضحية',
  D: 'غير الاجتماعية',
}

export const MAIN_TYPE_DEFINITIONS: Record<MainTypeKey, MainTypeDefinition> = {
  guide: {
    key: 'guide',
    label: 'الأم الموجِّهة',
    emoji: '🟢',
    fullDescriptionHtml: `
      <h3>🟢 الأم الموجِّهة</h3>
      <p>تميلين إلى تنظيم حياة طفلك ووضع قواعد واضحة، وتشعرين بالاطمئنان عندما تسير الأمور كما ينبغي. حضورك قوي ويمنح طفلك إطارًا واضحًا، وهذا يساعده على فهم ما هو متوقع منه، لكنه قد يشعر أحيانًا بأن عليه أن يكون “دائمًا على صواب”.</p>
      <p><strong>قوتك:</strong> وضوح وحدود تمنح الاستقرار<br/>
      <strong>الانتباه:</strong> الإفراط في الحزم قد يخلق توترًا أو خوفًا من الخطأ<br/>
      <strong>خطوة بسيطة:</strong> اختاري موقفًا واحدًا اليوم واسمحي فيه بهامش تجربة دون تصحيح فوري</p>
    `,
  },
  pleaser: {
    key: 'pleaser',
    label: 'الأم المُرضية / المرهَقة',
    emoji: '🟡',
    fullDescriptionHtml: `
      <h3>🟡 الأم المُرضية / المرهَقة</h3>
      <p>تحرصين على راحة طفلك وتسعين لأن يكون راضيًا، وغالبًا تسبقين حاجته وتستجيبين بسرعة. هذا يجعلك قريبة وحنونة، لكن قد تجدين نفسك متعبة، ويتغيّر أسلوبك عندما يشتد الضغط.</p>
      <p><strong>قوتك:</strong> دفء واحتواء يشعر به طفلك<br/>
      <strong>الانتباه:</strong> الاستجابة المستمرة على حسابك قد تُرهقك وتربك الحدود<br/>
      <strong>خطوة بسيطة:</strong> قبل أي استجابة، خذي نفسًا قصيرًا واسألي: “هل أستطيع الآن أم أؤجّل دقيقة؟”</p>
    `,
  },
  rescuer: {
    key: 'rescuer',
    label: 'الأم المُنقِذة',
    emoji: '🟠',
    fullDescriptionHtml: `
      <h3>🟠 الأم المُنقِذة</h3>
      <p>تميلين إلى حلّ المواقف بسرعة حتى لا يتعطّل يوم طفلك أو يتضايق. حضورك عملي ومساند، لكن قد يعتاد طفلك أن الحل يأتي من الخارج بدل أن يجرّبه بنفسه.</p>
      <p><strong>قوتك:</strong> مبادرة وسرعة دعم<br/>
      <strong>الانتباه:</strong> كثرة التدخل قد تقلّل من اعتماده على نفسه<br/>
      <strong>خطوة بسيطة:</strong> في موقف اليوم، اسأليه: “ما أول خطوة تستطيع فعلها؟” وانتظري قليلًا قبل التدخل</p>
    `,
  },
  independent: {
    key: 'independent',
    label: 'الأم المستقلة',
    emoji: '⚫',
    fullDescriptionHtml: `
      <h3>⚫ الأم المستقلة</h3>
      <p>تشجّعين طفلك على الاعتماد على نفسه وتمنحينه مساحة ليتعلّم. هذا يبني قوة واستقلالية، لكن قد يحتاج أحيانًا إشارات قرب واهتمام أوضح.</p>
      <p><strong>قوتك:</strong> ثقة ومساحة للنمو<br/>
      <strong>الانتباه:</strong> المسافة الزائدة قد تُفهم كغياب عاطفي<br/>
      <strong>خطوة بسيطة:</strong> خصّصي 10 دقائق يوميًا لحضور كامل (بدون هاتف) لمشاركته ما يحب</p>
    `,
  },
}

function inRange(id: number, min: number, max: number) {
  return id >= min && id <= max
}

function countByType(options: QuizOption[]) {
  const counts: Record<MainTypeKey, number> = {
    guide: 0,
    pleaser: 0,
    rescuer: 0,
    independent: 0,
  }

  options.forEach((option) => {
    counts[option.mainType] += 1
  })

  return counts
}

function pickShadowType(options: QuizOption[]) {
  const shadowCounts: Record<ShadowOptionKey, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  }

  options.forEach((option) => {
    shadowCounts[option.key] += 1
  })

  const ordered = (Object.keys(shadowCounts) as ShadowOptionKey[])
    .map((key) => ({ key, count: shadowCounts[key] }))
    .sort((a, b) => b.count - a.count)

  return SHADOW_LABELS[ordered[0]?.key ?? 'A']
}

export function calculateQuizResult(answers: QuizAnswers): QuizResult {
  const selections = Object.entries(answers)
    .map(([id, option]) => ({ id: Number(id), option }))
    .filter((entry): entry is { id: number; option: QuizOption } => Boolean(entry.option))

  const q1To10 = selections
    .filter((entry) => inRange(entry.id, PRIMARY_RANGE.min, PRIMARY_RANGE.max))
    .map((entry) => entry.option)

  const q16To20 = selections
    .filter((entry) => inRange(entry.id, SECONDARY_RANGE.min, SECONDARY_RANGE.max))
    .map((entry) => entry.option)

  const q11To15 = selections
    .filter((entry) => inRange(entry.id, SHADOW_RANGE.min, SHADOW_RANGE.max))
    .map((entry) => entry.option)

  const primaryCounts = countByType(q1To10)
  const secondaryCounts = countByType(q16To20)

  const normalizedScores: Record<MainTypeKey, number> = {
    guide: (primaryCounts.guide / 10) * MAIN_WEIGHT + (secondaryCounts.guide / 5) * SECONDARY_WEIGHT,
    pleaser: (primaryCounts.pleaser / 10) * MAIN_WEIGHT + (secondaryCounts.pleaser / 5) * SECONDARY_WEIGHT,
    rescuer: (primaryCounts.rescuer / 10) * MAIN_WEIGHT + (secondaryCounts.rescuer / 5) * SECONDARY_WEIGHT,
    independent: (primaryCounts.independent / 10) * MAIN_WEIGHT + (secondaryCounts.independent / 5) * SECONDARY_WEIGHT,
  }

  const ranked = (Object.keys(normalizedScores) as MainTypeKey[])
    .map((key) => ({ key, score: normalizedScores[key] }))
    .sort((a, b) => b.score - a.score)

  const mainType = MAIN_TYPE_DEFINITIONS[ranked[0]?.key ?? 'guide']
  const candidateSecondary = ranked[1] ? MAIN_TYPE_DEFINITIONS[ranked[1].key] : null
  const hasMixedResult = ranked[0] && ranked[1]
    ? ranked[0].score - ranked[1].score <= MIXED_DELTA_THRESHOLD
    : false

  return {
    mainType,
    secondaryType: hasMixedResult ? candidateSecondary : null,
    shadowTypeLabel: pickShadowType(q11To15),
    normalizedScores,
  }
}
