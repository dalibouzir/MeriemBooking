import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Noto_Naskh_Arabic } from 'next/font/google'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'
import { ChapterNav, EditorialPage, PortraitStage, SignaturePanel } from '@/components/editorial/Experience'
import JourneyExplorer from './JourneyExplorer'
import MobileEnrollment from '@/components/editorial/MobileEnrollment'
import s from './program.module.css'

const naskh = Noto_Naskh_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], display: 'swap', variable: '--program-display' })

export const metadata: Metadata = {
  title: 'نساء على الفطرة — البرنامج التدريبي',
  description: 'رحلة تدريبية من ثمانية أسابيع، لفهم نفسك ومشاعرك، والتقدّم نحو أهدافك، وبناء علاقات أكثر إشباعًا ووعيًا.',
  alternates: { canonical: '/train-program' },
  twitter: {
    card: 'summary_large_image',
    title: 'نساء على الفطرة — البرنامج التدريبي',
    description: 'أكثر اتّصالاً بنفسك… وأكثر اتزانًا في علاقاتك',
    images: ['/Meriem.png'],
  },
  openGraph: {
    title: 'نساء على الفطرة — Fittrah Women training',
    description: 'أكثر اتّصالاً بنفسك… وأكثر اتزانًا في علاقاتك',
    url: '/train-program',
    images: [{ url: '/Meriem.png', width: 1080, height: 1080, alt: 'مريم بوزير' }],
  },
}

const outcomes = [
  'فهمًا أعمق لنفسك: لمشاعرك واحتياجاتك، ولما يقف خلف بعض ردود أفعالك المتكرّرة.',
  'أدوات عملية للتعامل مع الأوقات الصعبة: حين يزداد الخوف أو الإحباط أو يصعب عليكِ الاستمرار.',
  'خطوات أوضح نحو أهدافك: تساعدك على فهم ما يعطّلك والعودة إلى الحركة.',
  'وعيًا أكبر في علاقاتك: لتعبّري عن احتياجاتك، وتفهمي دورك، وتضعي حدودك بما ينسجم مع قيمك.',
  'طرقًا لبناء علاقات أكثر إشباعًا: فيها قرب وعطاء، ومساحة لكِ أيضًا.',
  'اكتشافات جديدة من التجربة الجماعية: من مشاركتك، ومن الاستماع إلى تجارب الأخريات.',
]
const practices = [
  'لقاء تدريبي نفهم فيه موضوعًا محدّدًا ونتدرّب على أدواته.',
  'تطبيق عملي طوال الأسبوع تربطينه بمواقفك وعلاقاتك وحياتك.',
  'مساحة للمشاركة والأسئلة تعمّق الفهم وتساعدك على الاستفادة من التجربة.',
]

// Preview values only. Registration remains disabled until real details are supplied.
const preview = {
  start: '10 يناير 2027',
  weeklyDay: 'الأحد',
  weeklyTime: '18:00–20:00',
  platform: 'Zoom',
  price: '480 دينار تونسي',
  registration: 'رابط تسجيل تجريبي — غير مفعّل',
}

const chapters = [
  { id: 'program-journey', label: 'الرحلة' },
  { id: 'program-outcomes', label: 'ما بعد الرحلة' },
  { id: 'program-enrollment', label: 'الانضمام' },
]

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className={s.sectionLabel}><span aria-hidden="true">{number}</span><span>{children}</span></div>
}

export default function TrainProgramPage() {
  return (
    <EditorialPage className={`${s.page} ${naskh.variable}`}>
      <section className={s.hero} aria-labelledby="training-title">
        <div className={s.heroCopy}>
          <p className={s.brand} lang="en">Fittrah Women training</p>
          <h1 id="training-title"><span className={s.overline}>برنامج تدريبي :</span><span className={s.heroTitle}>نساء على <em>الفطرة</em></span></h1>
          <p className={s.heroPromise}>أكثر اتّصالاً بنفسك… وأكثر اتزانًا في علاقاتك</p>
          <p className={s.heroDescription}>رحلة تدريبية من ثمانية أسابيع، لفهم نفسك ومشاعرك، والتقدّم نحو أهدافك، وبناء علاقات أكثر إشباعًا ووعيًا.</p>
          <p className={s.heroDescription}>نأخذ بيدكِ خطوة بخطوة، في مسار منظّم ومتدرّج: كل أسبوع نبني على ما تعلّمناه، ونتدرّب على أدوات عملية، ثم تطبّقينها في حياتك طوال الأسبوع، ليصبح الفهم ممارسةً يظهر أثرها في اختياراتك ومواقفك اليومية.</p>
          <a className={s.button} href="#program-enrollment">أريد الانضمام إلى البرنامج<ArrowLeftIcon aria-hidden="true" /></a>
        </div>
        <PortraitStage src="/Meriem.png" variant="training" />
      </section>
      <ChapterNav items={chapters} />
      <section className={`${s.wrap} ${s.intro}`} aria-labelledby="understand-title">
        <div><SectionLabel number="01">مساحة للفهم</SectionLabel><h2 id="understand-title">تبذلين الكثير…<br />وتحتاجين أن تفهمي نفسك أكثر؟</h2></div>
        <div className={s.prose}>
          <p>قد تكون لديكِ أهداف تريدين تحقيقها، لكن الخوف أو التشتّت يؤخّرك. وقد تبدئين بحماس، ثم يأتي الإحباط فتحتارين كيف تواصلين.</p>
          <p>وفي علاقاتك، قد تتعبين من كثرة العطاء، أو يصعب عليكِ التعبير عن احتياجاتك ووضع حدودك، رغم رغبتك في القرب والودّ.</p>
          <p>في فطرة Women، نمنح هذه التجارب مساحة للفهم والعمل، ونرافقكِ لتكتشفي ما يحدث داخلك، وتتعلّمي طرقًا تساعدك على التعامل معه.</p>
        </div>
      </section>
      <section className={s.journey} id="program-journey" aria-labelledby="journey-title"><div className={s.wrap}>
        <header className={s.journeyHeader}><div><SectionLabel number="02">خطوة بخطوة</SectionLabel><h2 id="journey-title">كيف تسير الرحلة؟</h2></div><p>ثمانية أسابيع، نلتقي فيها كل أسبوع، على مرحلتين متكاملتين:</p></header>
        <JourneyExplorer stages={[
          { title: 'أربعة أسابيع للاتزان الذاتي', content: <><p>تفهمين نفسك، وتتعلّمين كيف تتعاملين مع ما تشعرين به.</p><p>نبدأ بعلاقتك بنفسك: مشاعرك، واحتياجاتك، وما يؤثّر في اختياراتك وردود أفعالك.</p><p>تتدرّبين على التعامل مع الخوف والإحباط وأوقات انخفاض الحماس، وعلى استعادة اتجاهك عندما تتعطّلين، لتواصلي السعي نحو ما يهمّك بوعي أكبر.</p></> },
          { title: 'أربعة أسابيع للاتزان في العلاقات', content: <><p>تتعلّمين كيف تبنين علاقات مُشبعة، وتضعين حدودك بوعي.</p><p>للعلاقات مكانة كبيرة في حياتك، وما تعيشينه فيها ينعكس على مشاعرك وراحتك ويومك.</p><p>نتناول علاقتك بالآخر، سواء كان والدًا أو والدة، زوجًا، طفلًا، صديقةً أو زميلًا. تتعلّمين كيف تفهمين احتياجاتك وقيمك، وتوضّحين دورك وحدودك في كل علاقة، وتوازنين بين العطاء ومراعاة نفسك.</p></> },
        ]} />
      </div></section>
      <section className={`${s.wrap} ${s.community}`} aria-labelledby="community-title">
        <div className={s.communityArt} aria-hidden="true"><span>أنتِ</span><span>معًا</span><div /></div>
        <div><SectionLabel number="03">التجربة الجماعية</SectionLabel><h2 id="community-title">تجربة تتعلّمين فيها عن نفسك… ومع الأخريات</h2><div className={s.prose}>
          <p>في اللقاءات، تجدين مساحة لمشاركة تجربتك بالقدر الذي يناسبك، والاستماع إلى تجارب نساء أخريات.</p>
          <p>أحيانًا تسمعين امرأة تصف شعورًا، فتجدين الكلمات التي كنتِ تبحثين عنها. وأحيانًا ترين نفسك في موقف عاشته أخرى، فتكتشفين شيئًا لم تنتبهي إليه من قبل.</p>
          <p>هكذا تصبح تجارب المجموعة فرصة لفهم أعمق، ورؤية أوسع، والتعلّم من بعضكنّ.</p>
        </div></div>
      </section>
      <section className={s.outcomes} id="program-outcomes" aria-labelledby="outcomes-title"><div className={s.wrap}>
        <header className={s.sectionHead}><SectionLabel number="04">أثر يبقى معكِ</SectionLabel><h2 id="outcomes-title">ما الذي تحملينه معك بعد الرحلة؟</h2></header>
        <ul className={s.outcomeGrid}>{outcomes.map((text, i) => { const split = text.indexOf(':'); return <li key={text}><span className={s.itemNumber} aria-hidden="true">0{i + 1}</span><div><h3>{text.slice(0, split + 1)}</h3><p>{text.slice(split + 2)}</p></div></li> })}</ul>
      </div></section>
      <section className={`${s.wrap} ${s.practice}`} aria-labelledby="practice-title"><div><SectionLabel number="05">الفهم يصبح ممارسة</SectionLabel><h2 id="practice-title">كيف ننتقل من المعرفة إلى التغيير؟</h2><p className={s.weeklyLabel}>في كل أسبوع:</p></div>
        <div><ol className={s.practiceList}>{practices.map((text, i) => <li key={text}><span aria-hidden="true">0{i + 1}</span><p>{text}</p><CheckIcon aria-hidden="true" /></li>)}</ol><p className={s.practiceClosing}>المسار منظّم ليأخذكِ من الفهم إلى التطبيق، ثم إلى ملاحظة ما يتغيّر في استجاباتك واختياراتك. ويتعمّق أثره بقدر مشاركتك وممارستك.</p></div>
      </section>
      <section className={s.audience} aria-labelledby="audience-title"><div className={s.wrap}><SectionLabel number="06">من واقعكِ أنتِ</SectionLabel><h2 id="audience-title">لمن هذا البرنامج؟</h2><p className={s.audienceLead}>لكل امرأة تريد أن تفهم نفسها أكثر، وتتعامل مع مشاعرها بوعي، وتحسّن علاقتها بنفسها وبالآخر.</p><p>سواء كنتِ غير متزوّجة، أو زوجة، أو أمًّا، تعملين أو تدرسين أو تتفرّغين لبيتك؛ تنطلقين من واقعك وتجاربك، وتطبّقين ما تتعلّمينه على ما يهمّك أنتِ.</p></div></section>
      <section className={`${s.wrap} ${s.mentor}`} aria-labelledby="mentor-title">
        <SignaturePanel />
        <div><SectionLabel number="07">مَن ترافقكِ في هذه الرحلة؟</SectionLabel><h2 id="mentor-title">مريم بوزير</h2><p className={s.mentorRole}>مؤسِّسة فطرة Women</p><div className={s.prose}>
          <p>خلفيتي في البحث العلمي ومجال صناعة الأدوية، ثم اتّجهت إلى دراسة المشاعر والعلوم الفطرية والإرشاد الأسري على مدى أربع سنوات.</p>
          <p>ومن خلال العمل مع سيدات من خلفيات ومراحل حياتية مختلفة، والتعامل شبه اليومي مع العميلات، تعمّق فهمي للتحدّيات التي تعيشها المرأة مع نفسها وفي علاقاتها، ولأهمية أن تجد أدوات واضحة تستطيع تطبيقها في واقعها.</p>
          <p>فطرة Women خلاصة هذا التعلّم والعمل والتجارب، جمعتها في مسار تدريبي منظّم ومتدرّج، يرافقكِ خطوة بخطوة، ويمنحكِ مساحة للفهم والتطبيق واكتشاف نفسك.</p>
        </div></div>
      </section>
      <section id="program-enrollment" className={s.enrollment} aria-labelledby="enrollment-title"><div className={`${s.wrap} ${s.enrollmentGrid}`}>
        <div className={s.enrollmentCopy}><SectionLabel number="08">مساحتكِ القادمة</SectionLabel><h2 id="enrollment-title">امنحي نفسك مساحة لتفهمي… وتجربي… وتتقدّمي</h2><p>ثمانية أسابيع تلتفتين فيها إلى نفسك، وتتدرّبين على ما يساعدك في أيامك الصعبة، وأهدافك، وعلاقاتك.</p><button type="button" className={s.button} disabled aria-describedby="preview-note">أنضمّ إلى فطرة Women<ArrowLeftIcon aria-hidden="true" /></button></div>
        <div className={s.enrollmentDetails}><p id="preview-note" className={s.previewNote}>بيانات تجريبية للمعاينة — الموعد والرسوم غير نهائيين.</p><dl>
          <div><dt>موعد البداية:</dt><dd>{preview.start}</dd></div>
          <div><dt>اللقاء الأسبوعي:</dt><dd>{preview.weeklyDay}، <bdi dir="ltr">{preview.weeklyTime}</bdi> · توقيت تونس (<bdi dir="ltr">UTC+1</bdi>)</dd></div>
          <div><dt>مكان اللقاء:</dt><dd>{preview.platform}</dd></div>
          <div><dt>رسوم الاشتراك:</dt><dd className={s.price}>{preview.price}</dd></div>
          <div><dt>طريقة الاشتراك:</dt><dd>{preview.registration}</dd></div>
        </dl></div>
      </div></section>
      <MobileEnrollment target="program-enrollment" title="نساء على الفطرة" subtitle="8 أسابيع للفهم والتطبيق" label="تفاصيل الانضمام" />
    </EditorialPage>
  )
}
