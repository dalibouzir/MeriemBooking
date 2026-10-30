'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Accordion from '@/components/ui/Accordion'
import heroImage from '@/assets/hero-image.png'
import { supabaseClient } from '@/lib/supabase'
import {
  mapLibraryItems,
  mapLegacyProducts,
  type LibraryItemRow,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'
import { useRevealOnScroll } from '@/utils/reveal'

const CALENDLY_URL = 'https://calendly.com/meriembouzir/30min?month=2025-12'
const WHATSAPP_COMMUNITY_URL = 'https://whatsapp.com/channel/0029Vb7aDlsISTkEqMO2sj1O'
const PRODUCTS_ROUTE = '/products'
const FOUNDER_ALT = 'مريم بوزير'

const REVIEWS = [
  {
    text: 'Thank youu so much Meriem. Walah mahlek 3ale5r w mashalah 3la 5edmtk. Jsuis tres heureuse enek jit fi tri9i ❤️❤️❤️❤️',
    color: '142, 249, 252',
  },
  {
    text: 'Mercii encore une fois Maryem, farhana barcha enek mawjouda fedenya❤️',
    color: '255, 196, 164',
  },
  {
    text: '3arfet kifech Elle anticipe 7ajet eni Mezelt mawselthomch, eni Eli moch bel sehel bech ne9tana3 5ater kol chay 3andi nebni Ken 3al logique w raison w kol youm nzid ne9tana3 akther w nal9a Eli klemerk y7arrakli fel Eli n7es bih reelleement lkol melloul kont n7es b chwya estefzez 5ater l79i9a enti kenet m5obbia w 7fert 3liha w mba3d nerte7 barcha w narja3 netnaffes Mel les profondeurs',
    color: '255, 186, 240',
  },
  {
    text: 'أهلا أستاذة مريم أريد أن أشكرك كثيرا جدا في أول قبل ما أبدأ الجلسة كنت بفكر كثير وخايفة شوية لكن ما إن بديتها معك حسيت براحة تامة وحسيت بأريحية تامة كأني أتكلم مع صديقتي أو شخص بعرفو من زمان حتى طريقتك في الكلام تخلي الواحد يشعر بشعور ومنعش وطيب جميل ومريح 😘. أما بالنسبة للجلسة حرفيا كل المشاعر التي أشعر بها يااااستطعي معرفتها لدرجة أنه في مشاعر وأشياء أنا ما قلتها وأنت اللهم بارك ذكرتها لي كنت دقيقة في وصف وشرح ومعرفة ما أشعر به حرفيا 💞 واندهشت من الشعور لي أنا فعلا محتاجة أشتغل عليه وما كنت بظن أنه هو أشكرك جدا 💕. كنت بتسمعيني وتعطيني وقت وماتحكمي عليا بالعكس كنت تحسسيني أنك فاهماني وأيضا تردين على أسئلتي وكثير واقعية في كلامك وصادقة أنا حبيتك من أول ثواني 💗. وكمان أعطيتني الحل المناسب لحالتي. أنا أشكرك جدا على وقتك وطيوبتك ولطفك الجميل معي أرجو لك تحقيق ما تريدين في حياتك وأنتي من بين أجمل الناس الذين التقيت بهم 🥰',
    color: '186, 210, 255',
  },
  {
    text: 'kont Enti sbeb Bech na3ref rou7i, rou7i Eli makontechi na3refha w mechi fibeli na3refha l9itha lyoum w bdit n7ebha kima hia men8ir chourout, bdit net9abbel fi tbi3ti w narja3 lfitrti w e9tana3t Eli enou el ontha 9adra tkoun fe3la ama Kima hia ka ontha moch tkoun mostarjla,t3allemt mennek barcha w kol youm nzid net3allem mennek w Ken nal9a seance m3ak metoufech wellet activite mta3 ra7a Bennesba lili, on dirait sefert brou7i l3alem e5er 3alem fih toma2nina w ra7a metoutousefch.',
    color: '255, 221, 150',
  },
  {
    text: 'أنا شخص عنده الكثير من الحدود في الانفتاح بالحديث عن مشكلاته، ويحب ويحاول أحلها لوحدي أو أتجاوزها.. - هيك فكرت - حتى حكيت معك يا مريم.. على الرغم إنك بتحطي إيدك بالجرح بالضبط إلا إني بكون سعيدة ومنبهرة كيف توصلي لأصل المشكلة حتى لو عمرها عشرات السنين ومدفونة جواتي.. انتي جدا حدّا كثير يخاطب المشاعر والمنطق مع بعض، بتعاملي بكل موضوعية مع المشكلة ولكن من غير قسوة.. والمهر كما طريقك في وضع الحلول المناسبة لشخصيتي.. من تجربتي انتي حدا عارف وفاهم ودارس وحابب اللي بعمله وهذا شي نادر جدا.. بحب كل مرة بنحكي فيها وبتنجحي كيف تعرفي أصل المشكلة وطريقة حلها ومحاولاتك المستمرة مرة بلطف وحب.. ممتنة الك وسعيدة طول الوقت خلال الجلسات وبعدها 🥰',
    color: '168, 222, 175',
  },
  {
    text: 'مريم عاونتني إني نتجاوز فترة تعيدت بيها في علاقتي مع راجلي و نحن النساء عامة ديما عنا مشكلة في العلاقات مههه علاقتنا بانسان نحبو أو حبيناه علاقتنا برجالنا علاقتنا بصغارنا و بحموانتنا و ساعات بعائلاتنا... مريم حرفيا ربي بعثها ليا في الفترة هذيكة باش نولي بصيرتي كيفما يقولوا. كنت كلما نحكي معاها و نسالها و تسالني بدأت معايا من أول المشكلة و الي هي إني مريم علمتني نتحكم في أعصابي علمتني وقتاش لازم نتكلم و وقتاش لازم نسكت علمتني شنو لازم أقول و شنو الحاجات الي تتنقش عليها و الحاجات الي ما تستحقش مني حتى ردة فعل بمعنى اخر مريم علمتني \"كيف اختار معاركي!\" مش كل نقاش لازم ندخل فيه و مش كل كلمة لازم نرد عليها مش كل تلميح نافقوا عندوا و مش كل نظرة تستحق منا عرك و معروك الحاصل وليت كل ما وحدة نعرفها تقلّي عندي مشاكل مع راجلي طول نقلهالها عليك بمريم 😁😁 بالحق يعطيك الصحة يا مريموا و ربي يزيدك علم و ينفع بيك جنس حواء و آدم 😍😍😍',
    color: '255, 180, 180',
  },
  {
    text: 'والله كلمة حق تقال انك علمتني كيفاش نتعامل راجلي',
    color: '192, 189, 255',
  },
  {
    text: 'ربي يبقي ستروا علينا اجمعين و ربي يرزقك و يعطيك من كل خير',
    color: '255, 214, 182',
  },
  {
    text: 'Je me sens beaucoup mieux et plus équilibrée depuis que je travaille avec Mariem. Chaque séance m’aide à clarifier mes idées et à avancer avec davantage de confiance. Mariem est toujours à l’écoute : elle prend réellement le temps, toujours plus d’une heure, voire deux, pour m’accompagner. Elle comprend très bien ce que je lui partage, elle analyse avec précision et me renvoie des pistes pertinentes. Grâce à elle, j’ai découvert des aspects de ma personnalité que je n’avais jamais réalisés en 27 ans. J’apprécie aussi sa clarté, sa structure et la cohérence de son approche. Ses idées et son plan d’accompagnement sont toujours bien organisés, ce qui me permet de progresser sereinement. En résumé, Mariem exceptionnelle, professionnelle, bienveillante et très investie dans le suivi de ses clientes ❤️.',
    color: '160, 228, 255',
  },
]

const SESSION_FAQ_ITEMS = [
  {
    id: 'session-details',
    title: 'ما تفاصيل جلسة الإرشاد نحو الاتزان؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-card-single">
          <p>
            جلسة فردية للإرشاد نحو الاتزان، هادئة وعميقة مدّتها ساعة كاملة. أهيئ لك خلالها مساحة آمنة لتفهمي مشاعرك،
            وتستعيدي توازنك الداخلي بخطوات واضحة ومدروسة ترافق يومك بعد المكالمة.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'session-fit',
    title: 'لمن تناسب هذه الجلسة؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card">
          <ul className="landing-session-list">
            <li>
              <strong>يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية</strong>
              <span>(علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)</span>
            </li>
            <li>
              <strong>يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته</strong>
              <span>أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها.</span>
            </li>
            <li>
              <strong>لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق</strong>
              <span>(الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'session-process',
    title: 'ماذا نفعل داخل الجلسة؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card">
          <p className="landing-session-label">ماذا نفعل داخل الجلسة؟</p>
          <ul className="landing-session-list">
            <li>
              <strong>استخراج الكود العاطفي للمشكلة الأساسية</strong>
              <span>من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.</span>
            </li>
            <li>
              <strong>تحويل الكود المضطرب إلى كود متزن</strong>
              <span>ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'session-note',
    title: 'ملاحظة مهمة عن الجلسات',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-note-card" role="note">
          <p className="landing-session-label">ملاحظة مهمة</p>
          <p>
            تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من
            أشكال جلد الذات.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'session-booking',
    title: 'كيف أحجز جلسة الإرشاد؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-cta">
          <div>
            <p className="landing-session-label">الحجز</p>
            <p className="landing-session-cta-copy">جلسات سرّية، فردية، ومخصّصة لك تمامًا.</p>
          </div>
          <Link href={CALENDLY_URL} className="landing-btn landing-btn-primary" target="_blank" rel="noopener noreferrer">
            احجزي جلستك
          </Link>
        </div>
      </div>
    ),
  },
]

const FAQ_SNIPPET = [
  ...SESSION_FAQ_ITEMS,
  {
    id: 'gift-code',
    title: 'كيف أستخدم رمز المكالمة المجانية؟',
    content:
      'بعد تحميل أي مورد يُرسَل إليك رمز له صلاحية 30 يومًا. انتقلي إلى صفحة “استبدال الرمز” وأدخليه ثم اختاري الموعد الذي يناسبك.',
  },
  {
    id: 'download-access',
    title: 'هل يمكنني إعادة تحميل الملف لاحقًا؟',
    content:
      'بالطبع. وصلك بريد يحتوي على رابط دائم، كما يمكنك العودة إلى صفحة التنزيل مع نفس البريد الإلكتروني لتحميل الملف متى شئت.',
  },
  {
    id: 'sessions',
    title: 'ما الفرق بين الجلسة المجانية والمدفوعة؟',
    content:
      'المجانية مخصّصة لتقييم الوضع الحالي وتقديم خطة أولية. الجلسة المدفوعة أعمق وتشمل متابعة أسبوعية وملفًا ملخّصًا بالتوصيات.',
  },
]

type SocialLink = {
  href: string
  label: string
  icon: string
  variant?: 'linktree'
}

const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://linktr.ee/meriembouzir', label: 'لينك تري', icon: '🌿', variant: 'linktree' },
  { href: 'https://www.instagram.com/fittrah.moms', label: 'إنستغرام', icon: '📸' },
  { href: 'https://www.youtube.com/@fittrahmoms', label: 'يوتيوب', icon: '▶️' },
  { href: 'https://wa.me/21653498444', label: 'واتساب (+216 53 498 444)', icon: '💬' },
]

type LandingDisplay = {
  id: string
  title: string
  description: string
  summary?: string
  cover: string
  meta?: string
  href?: string
  badge?: string
  format?: string
  duration?: string
  typeLabel?: string
  reviews?: number
  dateLabel?: string
}

// const FALLBACK_SHOWCASE: LandingDisplay = {
//   id: 'showcase-fallback',
//   title: 'ملف العودة للسكينة',
//   description: 'ملف عملي يعيد ترتيب يوم الأم ويمنحك خطوات صغيرة تخلق سلامًا داخل البيت.',
//   summary: 'خطّة مختصرة تساعدك على تهدئة فوضى اليوم وإعادة وصل العائلة بالطمأنينة.',
//   cover:
//     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4peUdkcJz7xez1x9Gw-6Hnnlturg2SNLHVg&s',
//   meta: 'كتاب PDF · 12 صفحة',
//   href: PRODUCTS_ROUTE,
//   badge: 'مفضل',
//   format: 'كتاب PDF',
//   duration: '12 صفحة عملية',
//   typeLabel: 'كتاب',
//   reviews: 184,
//   dateLabel: 'ربيع 2024',
// }

const FALLBACK_FEATURES: LandingDisplay[] = [
  {
    id: 'feature-1',
    title: 'دليلك لتستعيدي هدوءك وتوازنك كأمّ',
    description:
      'ربيع الأول 1447 هـ\n\n' +
      'يضع هذا الكتيّب بين يديك استراتيجيات عملية تمكّنك من:\n' +
      '- إدارة مشاعرك بوعي وهدوء\n' +
      '- استعادة أنوثتك واتصالك بذاتك الحقيقية\n' +
      '- رسم حدود واضحة تحافظ على طاقتك وعلاقاتك الصحية',
    summary:
      'يضع هذا الكتيّب بين يديك استراتيجيات عملية تمكّنك من:\n' +
      '- إدارة مشاعرك بوعي وهدوء\n' +
      '- استعادة أنوثتك واتصالك بذاتك الحقيقية\n' +
      '- رسم حدود واضحة تحافظ على طاقتك وعلاقاتك الصحية',
    cover:
      'https://i.ibb.co/RhpnYWV/Enis-cyberpunk-ottoman-sultan-in-a-cyberpunk-city-8-K-hyperreali-e7506c88-2574-487c-838e-5bb8618dd1c.png',
    meta: 'كتاب PDF · 10 صفحات مركّزة',
    href: PRODUCTS_ROUTE,
    badge: 'مفضل',
    format: 'كتاب PDF',
    duration: '10 صفحات مركّزة',
    typeLabel: 'كتاب',
    reviews: 162,
    dateLabel: '19 سبتمبر 2025',
  },
  {
    id: 'feature-2',
    title: 'حوار أم وابنتها',
    description: 'نموذج عملي يساعدك على فتح مساحة حديث آمنة داخل البيت مع ابنتك.',
    summary: 'سلسلة أسئلة خفيفة تفتح الطريق لحوار دافئ وخالٍ من الأحكام بين الأم وابنتها.',
    cover:
      'https://i.ibb.co/SrNRC0b/Erkan-Erdil-angry-soviet-officer-shouting-his-soldiers8k-octane-7b802966-9d4e-4c6e-ac37-d4f751419081.png',
    meta: 'جلسة تطبيقية',
    href: PRODUCTS_ROUTE,
    badge: 'جلسة مباشرة',
    format: 'جلسة تطبيقية',
    duration: '45 دقيقة',
    typeLabel: 'جلسة',
    reviews: 94,
    dateLabel: 'خريف 2023',
  },
  {
    id: 'feature-3',
    title: 'إعادة وصل الزوجين',
    description: 'خطوات عملية قصيرة تساعد على الحفاظ على وئام العلاقة وسط الضغوط اليومية.',
    summary: 'محفّز عملي يساعدكما على إعادة ضبط النوايا وفتح مساحة ودّ متجددة بين الزوجين.',
    cover:
      'https://i.ibb.co/YjzSzjk/Erkan-Erdil-very-technical-and-detailed-blueprint-of-wolf-carve-bd937607-6a4f-4525-b4f2-b78207e64662.png',
    meta: 'كتاب PDF',
    href: PRODUCTS_ROUTE,
    badge: 'الأكثر طلبًا',
    format: 'كتاب PDF',
    duration: '18 صفحة إرشادية',
    typeLabel: 'كتاب',
    reviews: 203,
    dateLabel: 'صيف 2023',
  },
  {
    id: 'feature-4',
    title: 'جلسة تهدئة مسائية',
    description: 'تأمّل صوتي يساعدك على تهدئة التوتر قبل النوم والنزول تدريجيًا من ضجيج اليوم إلى سكينة الليل.',
    summary: 'مرافقة صوتية لطيفة تُهيئ جسدك وعقلك لنوم أعمق وأكثر طمأنينة.',
    cover:
      'https://i.ibb.co/VLfJ41h/MR-ROBOT-two-cyberpunk-cowboys-dueling-6ae4203d-3539-4033-a9d9-80d747ac6498.png',
    meta: 'جلسة صوتية',
    href: PRODUCTS_ROUTE,
    badge: 'تأمل صوتي',
    format: 'صوتيات',
    duration: '12 دقيقة',
    typeLabel: 'جلسة',
    reviews: 118,
    dateLabel: 'ربيع 2023',
  },
]

function mapResourceToDisplay(resource: ProductResource): LandingDisplay {
  const dateLabel = resource.createdAt
    ? new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(resource.createdAt))
    : undefined

  return {
    id: resource.id,
    title: resource.title,
    description: resource.snippet || resource.description,
    summary: resource.snippet || resource.description,
    cover: resource.cover,
    meta: resource.format
      ? `${resource.format}${resource.duration ? ` · ${resource.duration}` : ''}`
      : resource.duration || resource.type,
    href: resource.slug ? `/download?product=${resource.slug}` : `/download?product=${resource.id}`,
    badge: resource.badge,
    format: resource.format,
    duration: resource.duration,
    typeLabel: resource.type,
    reviews: resource.reviews,
    dateLabel,
  }
}

function shouldOptimizeImage(src: string): boolean {
  if (!src.startsWith('http')) return true
  try {
    const { hostname } = new URL(src)
    if (hostname.endsWith('supabase.co') || hostname.endsWith('supabase.in')) return true
    if (hostname === 'cdn.apartmenttherapy.info' || hostname === 'blogger.googleusercontent.com') return true
    return false
  } catch {
    return false
  }
}

export default function HomePage() {
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: libraryError } = await supabaseClient
          .from('library_items')
          .select('*')
          .order('created_at', { ascending: false })

        if (!libraryError && Array.isArray(data)) {
          const mapped = await mapLibraryItems(data as LibraryItemRow[])
          if (!cancelled) setResources(mapped)
          return
        }

        const fallback = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (!fallback.error && Array.isArray(fallback.data)) {
          const mapped = mapLegacyProducts(fallback.data as LegacyProductRow[])
          if (!cancelled) setResources(mapped)
          return
        }

        if (!cancelled) setError('تعذّر تحميل الموارد حاليًا. حاولي مجددًا بعد قليل.')
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('حدث خطأ غير متوقع. الرجاء المحاولة لاحقًا.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResources()
    return () => {
      cancelled = true
    }
  }, [])

  const featuredItems = useMemo(() => resources.slice(0, 4), [resources])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const featuredDisplay = featuredItems.length ? featuredItems.map(mapResourceToDisplay) : FALLBACK_FEATURES

  const landingRootRef = useRef<HTMLElement | null>(null)
  const reviewsTrackRef = useRef<HTMLDivElement | null>(null)

  useRevealOnScroll(landingRootRef, [featuredDisplay.length])

  // Scroll the testimonial track by one card. The track is RTL, so moving
  // forward through the content means a negative scrollLeft delta.
  const scrollReviews = useCallback((direction: 1 | -1) => {
    const track = reviewsTrackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>('.review-card')
    const step = (card?.offsetWidth ?? track.clientWidth * 0.8) + 14
    const rtl = getComputedStyle(track).direction === 'rtl'
    track.scrollBy({ left: direction * step * (rtl ? -1 : 1), behavior: 'smooth' })
  }, [])

  const handleScrollToFeatured = useCallback(() => {
    const el = document.getElementById('featured') ?? document.getElementById('landing-hot')
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [])

  const [leftFaqItems, rightFaqItems] = useMemo(() => {
    const left: typeof FAQ_SNIPPET = []
    const right: typeof FAQ_SNIPPET = []
    FAQ_SNIPPET.forEach((item, idx) => {
      if (idx % 2 === 0) left.push(item)
      else right.push(item)
    })
    return [left, right]
  }, [])

  return (
        <>
          <main className="landing-root" role="main" ref={landingRootRef}>
        {/* The hero is never a reveal target: the first screen must not wait for JS. */}
        <section className="landing-hero-v2" dir="rtl" aria-labelledby="landing-hero-title">
          <div className="landing-hero-bg" aria-hidden="true">
            <span className="blob-a" />
            <span className="blob-b" />
          </div>

          <div className="landing-hero-inner">
            <div className="landing-hero-figure">
              <div className="landing-hero-ring">
                <Image
                  src={heroImage}
                  alt={FOUNDER_ALT}
                  fill
                  sizes="(max-width: 900px) 60vw, 420px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="landing-hero-copy">
              <p className="landing-hero-brand" dir="ltr">Fittrah Women</p>
              <h1 id="landing-hero-title" className="landing-hero-h1">
                مساحتك للسكينة والأنوثة والاتزان العاطفي
              </h1>
              <p className="landing-hero-desc">
                منصّة تُساعد المرأة على استعادة أنوثتها وفطرتها لتعيش علاقاتٍ صحّية، وبيتًا أهدأ، ومجتمعًا أكثر اتّزانًا؛
                فحين تتّزن المرأة ينعكس نورها على أسرتها، ويمتدّ أثرها إلى الجيل القادم كلّه.
              </p>

              <div className="landing-hero-cta">
                <button type="button" className="landing-btn landing-btn-primary" onClick={handleScrollToFeatured}>
                  استكشفي الملفات المجانية
                </button>
                <Link
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-btn landing-btn-secondary"
                >
                  انضمي لمجتمعنا على WhatsApp
                </Link>
              </div>

              <ul className="landing-hero-trust" aria-label="ما تجدينه هنا">
                <li>ملفات مجانية للتحميل</li>
                <li>جلسات إرشاد فردية</li>
                <li>مجتمع داعم</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-section landing-bio reveal" data-reveal="left" aria-labelledby="landing-bio-title">
          <div className="landing-bio-card">
            <div className="landing-bio-figure">
              <Image src="/Meriem.jpeg" alt={FOUNDER_ALT} width={176} height={176} className="landing-bio-avatar" loading="lazy" />
              <div className="landing-bio-meta">
                <p className="landing-bio-name">مريم بوزير</p>
                <p className="landing-bio-role">مرشدة في الاتزان العاطفي والعلاقات</p>
              </div>
            </div>
            <div className="landing-bio-body">
              <h2 id="landing-bio-title">من أنا؟</h2>
              <p>أنا مريم بوزير، أمّ لطفلتين، تونسية أتنقّل بين تونس وفرنسا.</p>
              <p>
                هاجرتُ إلى فرنسا لاستكمال دراستي العليا في مجال صناعة الأدوية، لكنّ الأمومة كانت نقطة التحوّل الكبرى
                في حياتي؛ مرحلة حملت الكثير من الإرهاق، وتكرار الأمراض، وضباب المشاعر، وفقدان الاتصال بالذات، والتراجع
                عن الأهداف.
              </p>
              <p>
                هذا المنعطف دفعني للبحث بعمق عن جذور التعب النفسي والعضوي. درستُ المشاعر لمدة ثلاث سنوات، وتعمّقت في فهم
                كيف يقف خلف كل ألم — نفسي أو عضوي — شعور لم يُفهم بعد ولم يُسمَع صوته.
              </p>
              <p>
                إلى جانب خلفيتي العلمية، تابعتُ دبلومًا في الإرشاد الأسري والعلاقات، وبدأتُ أوّلًا ممارسة ما تعلّمته داخل
                أسرتي، ثم تحوّل ما عشته من تغيير إلى رسالة أعيشها كل يوم:
              </p>
              <blockquote className="landing-bio-quote-card" aria-label="رسالة مريم بوزير">
                <p>
                  “دعم النساء نحو الاتزان، وإرشادهن شعوريًا، وبالأخصّ مرافقة الأمهات لاستعادة حياتهن بوعي وطمأنينة.”
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Featured (أبرز الملفات المجانية) */}
        <section className="landing-section landing-hot reveal" data-reveal="right" id="featured" aria-labelledby="landing-hot-title">
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">الأحدث</p>
              <h2 id="landing-hot-title">أبرز الملفات المجانية</h2>
            </div>
            <Link href={PRODUCTS_ROUTE} className="landing-section-link">
              عرض كل الملفات
            </Link>
          </header>
          {loading ? (
            <div className="landing-skeleton-grid" aria-hidden>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`feature-skel-${index}`} className="landing-skeleton-card" />
              ))}
            </div>
          ) : (
            <>
              {error ? (
                <p className="landing-hot-error" role="status">
                  {error}
                </p>
              ) : null}
              <div className="landing-files-grid" role="list">
                {featuredDisplay.map((item, index) => (
                  <article
                    key={item.id}
                    className="landing-file-card reveal"
                    role="listitem"
                    tabIndex={0}
                    data-reveal={index % 2 === 0 ? 'left' : 'right'}
                  >
                    <div className="landing-file-media">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 88vw, (max-width: 1280px) 360px, 420px"
                        unoptimized={!shouldOptimizeImage(item.cover)}
                      />
                    </div>
                    <div className="landing-file-panel">
                      <div className="landing-file-panel-inner">
                        <div className="landing-file-panel-head">
                          <p className="landing-file-panel-title">{item.title}</p>
                          {(item.dateLabel || item.meta) && (
                            <div className="landing-file-panel-meta">
                              {item.dateLabel && <span>{item.dateLabel}</span>}
                              {item.meta && <span>{item.meta}</span>}
                            </div>
                          )}
                        </div>
                        <div className="landing-file-panel-section">
                          <p className="landing-file-panel-label">الوصف</p>
                          <p className="landing-file-panel-text">{item.description}</p>
                        </div>
                        {item.summary && item.summary !== item.description ? (
                          <div className="landing-file-panel-section">
                            <p className="landing-file-panel-label">لمحة</p>
                            <p className="landing-file-panel-text">{item.summary}</p>
                          </div>
                        ) : null}
                        <div className="landing-file-panel-cta">
                          <Link href={PRODUCTS_ROUTE} className="landing-file-panel-btn">
                            استكشفي الملفات
                          </Link>
                          <Link
                            href={CALENDLY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-file-panel-btn landing-file-panel-btn-secondary"
                          >
                            احجزي مكالمتك المجانية
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section
          id="reviews"
          className="landing-section landing-reviews reveal"
          dir="rtl"
          data-reveal="up"
          aria-labelledby="reviews-title"
        >
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">قصص نجاح</p>
              <h2 id="reviews-title">آراء وتجارب حقيقية</h2>
            </div>
            <div className="reviews-nav" aria-label="تصفح الآراء">
              <button type="button" className="reviews-nav-btn" onClick={() => scrollReviews(-1)} aria-label="المراجعة السابقة">
                <ChevronRightIcon aria-hidden />
              </button>
              <button type="button" className="reviews-nav-btn" onClick={() => scrollReviews(1)} aria-label="المراجعة التالية">
                <ChevronLeftIcon aria-hidden />
              </button>
            </div>
          </header>

          <div className="reviews-track" ref={reviewsTrackRef} role="list" aria-label="آراء النساء">
            {REVIEWS.map((review, index) => {
              const isArabic = /[\u0600-\u06FF]/.test(review.text)
              return (
                <figure
                  key={`review-${index}`}
                  className="review-card"
                  role="listitem"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  style={{ '--review-tint': review.color } as CSSProperties}
                >
                  <blockquote className="review-text">{review.text}</blockquote>
                  <figcaption className="review-meta">من رسائل المشتركات</figcaption>
                </figure>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="landing-faq reveal" data-reveal="up" aria-labelledby="landing-faq-title">
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">أسئلة شائعة</p>
              <h2 id="landing-faq-title">كل شيء عن المكتبة والرموز المجانية</h2>
            </div>
            <p className="landing-section-note">
              نجاوب عن أكثر الأسئلة التي تصلنا حول التحميل وإعادة الوصول للملفات والجلسة التعريفية.
            </p>
          </header>
          <div className="landing-faq-columns reveal" data-reveal="up">
            <div className="landing-faq-column">
              <Accordion items={leftFaqItems} defaultOpenIds={leftFaqItems.length ? [leftFaqItems[0].id] : []} />
            </div>
            <div className="landing-faq-column">
              <Accordion items={rightFaqItems} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer reveal" data-reveal="up">
          <div className="landing-footer-grid">
            <div className="landing-footer-main">
              ملفات، جلسات، ومساحات دعم تذكّرك بأنك لست وحدك في رحلة الأمومة. كل ما نشاركه مجاني وجاهز للتنزيل الفوري.
            </div>
            <div className="landing-footer-nav">
              <div className="landing-footer-col">
                <h3>روابط سريعة</h3>
                <Link href="/">الرئيسية</Link>
                <Link href={PRODUCTS_ROUTE}>المكتبة</Link>
                <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  احجزي مكالمتك المجانية
                </Link>
                <Link href="/train-program">بـرنـامـج تـدريـبـي</Link>
              </div>
              <div className="landing-footer-col">
                <h3>تواصل</h3>
                {SOCIAL_LINKS.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                    <span aria-hidden>{link.icon}</span> {link.label}
                  </a>
                ))}
                <a href="mailto:meriembouzir05@gmail.com">meriembouzir05@gmail.com</a>
              </div>
              <div className="landing-footer-col">
                <h3>الحجوزات</h3>
                <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  احجزي مكالمتك المجانية
                </Link>
                <Link href={PRODUCTS_ROUTE}>الحصول على رمز جديد</Link>
              </div>
              <div className="landing-footer-col">
                <h3>القانوني</h3>
                <Link href="/policy">الشروط والأحكام</Link>
                <Link href="/privacy">سياسة الخصوصية</Link>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© {currentYear} Fittrah Women</span>
            <span>كل الحقوق محفوظة لمريم بوزير</span>
          </div>
        </footer>
      </main>
    </>
  )
}
