import type { Metadata } from 'next'
import { Amiri } from 'next/font/google'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, MapIcon, HeartIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { ChapterNav, EditorialPage, PortraitStage, SignaturePanel } from '@/components/editorial/Experience'
import WorkshopReveal from './WorkshopReveal'
import MobileEnrollment from '@/components/editorial/MobileEnrollment'
import styles from './workshop.module.css'

const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], display: 'swap', variable: '--workshop-display' })

export const metadata: Metadata = {
  title: 'ورشة زواج على الفطرة مع مريم بوزير',
  description: 'ورشة تجمع الفهم والتطبيق، لتخرجي من الحيرة إلى رؤية أوضح لنفسكِ وللعلاقة التي تريدين بناءها.',
  alternates: { canonical: '/marriage-workshop' },
  twitter: {
    card: 'summary_large_image',
    title: 'ورشة زواج على الفطرة مع مريم بوزير',
    description: 'امنحي رغبتكِ في الزواج طريقًا أوضح.',
    images: ['/Meriem.jpeg'],
  },
  openGraph: {
    title: 'ورشة زواج على الفطرة مع مريم بوزير',
    description: 'امنحي رغبتكِ في الزواج طريقًا أوضح.',
    url: '/marriage-workshop',
    images: [{ url: '/Meriem.jpeg', width: 1536, height: 2048, alt: 'مريم بوزير' }],
  },
}

const discoveries = [
  {
    title: 'قبل أن تختاري… ماذا تريدين؟',
    text: 'لماذا تتزوّجين؟ ما معنى أن تكوني زوجة؟ وكيف تحدّدين المواصفات التي تهمّكِ فعلًا في شريك حياتكِ؟',
    Icon: HeartIcon,
  },
  {
    title: 'كيف تسعين نحو الزواج؟',
    text: 'خطوات تناسبكِ، وفهم للعوائق والمخاوف وأثر التجارب السابقة التي قد تربك سعيكِ واختياراتكِ.',
    Icon: MapIcon,
  },
  {
    title: 'وإذا ظهر شخص؟',
    text: 'كيف تتعاملين معه، وتفهمين مدى ملاءمته لكِ، وعلى أيّ أساس تقرّرين الاستمرار؟',
    Icon: ChatBubbleLeftRightIcon,
  },
]

const audiences = [
  'إذا كنتِ ترغبين في الزواج وتكوين عائلة، أيًّا كان عمركِ، سواء لم يسبق لكِ الارتباط أو مررتِ بتجربة سابقة.',
  'إذا تركت فيكِ علاقة أو خطوبة أو طلاق أو حبّ من طرف واحد ألمًا، وتريدين تجديد نظرتكِ للعلاقات.',
  'وإذا كنتِ أمًّا تريدين مرافقة ابنتكِ في طريقها نحو الزواج بوعي وفهم أكبر.',
]

const chapters = [
  { id: 'workshop-discover', label: 'المحاور' },
  { id: 'workshop-audience', label: 'لمن الورشة؟' },
  { id: 'workshop-details', label: 'تفاصيل اللقاء' },
]

export default function MarriageWorkshopPage() {
  return (
    <EditorialPage className={`${styles.page} ${amiri.variable}`}>
      <section className={styles.hero} aria-labelledby="workshop-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> ورشة</p>
          <h1 id="workshop-title" className={styles.title}>
            <span>زواج على</span>{' '}<span className={styles.titleAccent}>الفطرة</span>{' '}
            <span className={styles.titleByline}>مع مريم بوزير</span>
          </h1>
          <div className={styles.heroIntro}>
            <p className={styles.lead}>ترغبين في الزواج وتكوين عائلة…</p>
            <p className={styles.question}>لكن كيف تسعين؟ وكيف تعرفين أنّه الشخص المناسب؟</p>
          </div>
          <p className={styles.heroDescription}>من فهم معنى الزواج ودوركِ فيه، إلى وضوح ما تريدينه في شريك حياتكِ، وتحديد خطوات سعيكِ والتعامل مع ما يعترضها.</p>
          <p className={styles.heroDescription}>ورشة تجمع الفهم والتطبيق، لتخرجي من الحيرة إلى رؤية أوضح لنفسكِ وللعلاقة التي تريدين بناءها.</p>
          <a href="#workshop-details" className={styles.primaryButton}>أحجز مكاني في الورشة<ArrowLeftIcon aria-hidden="true" /></a>
        </div>
        <PortraitStage src="/Meriem.jpeg" variant="workshop" />
      </section>
      <ChapterNav items={chapters} />

      <section className={`${styles.section} ${styles.discovery}`} id="workshop-discover" aria-labelledby="discover-title">
        <header className={styles.sectionHeader}><span className={styles.sectionNumber} aria-hidden="true">01</span><h2 id="discover-title">ماذا ستكتشفين؟</h2></header>
        <div className={styles.discoveryGrid}>
          {discoveries.map(({ title, text, Icon }, index) => (
            <WorkshopReveal key={title} delay={index * 0.06}>
              <div className={styles.discoveryItem}>
                <div className={styles.discoveryTop}><Icon aria-hidden="true" /><span aria-hidden="true">0{index + 1}</span></div>
                <h3>{title}</h3><p>{text}</p>
              </div>
            </WorkshopReveal>
          ))}
        </div>
      </section>

      <section className={styles.audience} id="workshop-audience" aria-labelledby="audience-title">
        <div className={styles.audienceInner}>
          <header className={styles.audienceHeading}><span className={styles.sectionNumber} aria-hidden="true">02</span><h2 id="audience-title">هذه الورشة لكِ…</h2><span className={styles.audienceFlourish} aria-hidden="true">لكِ</span></header>
          <div className={styles.audienceList}>{audiences.map((text, index) => <div className={styles.audienceItem} key={text}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{text}</p></div>)}</div>
        </div>
      </section>

      <section className={styles.outcome} aria-labelledby="outcome-title">
        <span className={styles.outcomeRing} aria-hidden="true" />
        <div className={styles.outcomeInner}><span className={styles.sectionNumber} aria-hidden="true">03</span><h2 id="outcome-title">لتخرجي وأنتِ أوضح مع نفسكِ</h2><p>تعرفين ما تريدينه، وتفهمين دوركِ، وتحدّدين خطواتكِ، وتملكين أسسًا أوضح للاختيار والتعامل خلال التعارف والخطوبة.</p></div>
      </section>

      <section className={`${styles.section} ${styles.about}`} aria-labelledby="meriem-title">
        <SignaturePanel />
        <div className={styles.aboutCopy}><header className={styles.sectionHeader}><span className={styles.sectionNumber} aria-hidden="true">04</span><h2 id="meriem-title">مع مريم بوزير</h2></header>
          <p>مؤسّسة Fittrah Women. تكويني الأساسي في البحث العلمي وصناعة الأدوية، وتخصّصتُ خلال أربع سنوات في الإرشاد والمشاعر والعلوم الفطرية.</p>
          <p>جمعتُ في هذه الورشة خلاصة تكويني وخبرتي في مرافقة النساء، وما تعلّمتُه مع عميلاتي من تجارب وخطوات ساعدتهنّ على الوضوح والتقدّم نحو غاياتهنّ.</p>
        </div>
      </section>

      <section id="workshop-details" className={styles.details} aria-labelledby="details-title">
        <div className={styles.detailsInner}>
          <span className={styles.sectionNumber} aria-hidden="true">05</span>
          <h2 id="details-title">تفاصيل اللقاء</h2>
          <p className={styles.zoom}><VideoCameraIcon aria-hidden="true" />مباشرة عبر Zoom</p>
          <p id="workshop-schedule" className={styles.schedule}>[التاريخ والتوقيت] · [السعر]</p>
          <div className={styles.detailsRule} />
          <p className={styles.closing}>امنحي رغبتكِ في الزواج طريقًا أوضح.</p>
          {/* Enable registration once the workshop date, price and booking destination are decided. */}
          <button type="button" className={styles.primaryButton} disabled aria-describedby="workshop-schedule">أحجز مكان<ArrowLeftIcon aria-hidden="true" /></button>
        </div>
      </section>
      <MobileEnrollment target="workshop-details" title="زواج على الفطرة" subtitle="مع مريم بوزير" label="تفاصيل الورشة" />
    </EditorialPage>
  )
}
