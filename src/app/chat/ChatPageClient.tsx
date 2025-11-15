'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Tabs from '@/components/ui/Tabs'

const intakeSchema = z.object({
  fullName: z.string().min(3, 'اكتبي اسمك الكامل.'),
  email: z.string().email('رجاءً أدخلي بريدًا إلكترونيًا صالحًا.'),
  phone: z.string().min(8, 'أدخلي رقم هاتف أو واتساب للتواصل.'),
  focus: z.string().min(10, 'اشرحي التحدي الحالي ببعض التفاصيل.'),
  preferredSlot: z.string().optional(),
})

const feedbackSchema = z.object({
  sessionCode: z.string().min(4, 'أدخلي رمز الجلسة أو اسمك.'),
  // z.number() to match RHF valueAsNumber
  rating: z.number().min(1).max(5),
  highlight: z.string().optional(),
  nextFocus: z.string().min(6, 'أخبرينا ماذا تودين تغطيته لاحقًا.'),
})

const supportSchema = z.object({
  topic: z.string().min(4, 'اختاري موضوع الدعم.'),
  message: z.string().min(10, 'اكتبي وصفًا قصيرًا للمشكلة.'),
  attachment: z.string().optional(),
})

type IntakeFormValues = z.infer<typeof intakeSchema>
type FeedbackFormValues = z.infer<typeof feedbackSchema>
type SupportFormValues = z.infer<typeof supportSchema>

type FormStatus = {
  success: boolean
  message: string
}

const INITIAL_STATUS: FormStatus = { success: false, message: '' }

export default function ChatPageClient() {
  const tabs = useMemo(
    () => [
      {
        id: 'chat',
        title: 'شات مباشر',
        content: <LiveChatPanel />,
      },
      {
        id: 'forms',
        title: 'نماذج التقييم والمتابعة',
        content: <FormsPanel />,
      },
    ],
    [],
  )

  return (
    <div className="chat-shell">
      <section className="chat-hero">
        <h1>دردشة فورية ونماذج متابعة شخصية</h1>
        <p>
          نحب أن نبقى قريبين منكِ بعد أي جلسة أو أثناء تطبيق الموارد. يمكنك إرسال سؤالك فورًا عبر الشات أو
          ملء النماذج أدناه لنتابعك بخطوات دقيقة.
        </p>
      </section>

      <Tabs tabs={tabs} defaultTabId="chat" />
    </div>
  )
}

function LiveChatPanel() {
  const [hideSuggestions, setHideSuggestions] = useState(false)

  const examples = [
    'أحتاج مساعدة في تنظيم وقتي مع أطفالي.',
    'لدي استفسار عن دورة فطرة الرضيع.',
    'أواجه مشكلة في تحميل ملف من المنصة.',
  ]

  const handleExampleClick = (example: string) => {
    console.log('example clicked:', example)
    // فور الضغط: نخفي بلوك الاقتراحات
    setHideSuggestions(true)
  }

  return (
    <div className="chat-panel">
      <div className="chat-info-card">
        <h2>الشات الفوري</h2>
        <p>
          راسلينا الآن عبر الواتساب{' '}
          <a
            className="chat-link"
            href="https://wa.me/21629852313"
            target="_blank"
            rel="noopener noreferrer"
          >
            +216 29 852 313
          </a>
          . نرد عادة خلال 10 دقائق بين الساعة 9 صباحًا و6 مساءً بتوقيت تونس.
        </p>
        <ul className="chat-list">
          <li>تحديد موعد أو تعديل جلسة</li>
          <li>مساعدة في اختيار مورد أو دورة</li>
          <li>استفسارات تقنية حول التحميل والمشاهدة</li>
        </ul>

        {!hideSuggestions && (
          <div className="chat-suggestions">
            <p className="chat-suggestions-title">أمثلة لرسائل يمكنك إرسالها:</p>
            <div className="chat-suggestions-list">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="chat-suggestion-chip"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="chat-note">
          المحادثات محفوظة ومشفرة، ويمكنك طلب مسحها في أي وقت.
        </p>
      </div>

      <div className="chat-side-card">
        <h3>لا يمكن التواصل عبر الشات؟</h3>
        <p>
          يمكنك استخدام البريد المباشر{' '}
          <a className="chat-link" href="mailto:meriembouzir05@gmail.com">
            meriembouzir05@gmail.com
          </a>{' '}
          أو ملء نموذج الدعم في التبويب التالي.
        </p>
      </div>
    </div>
  )
}

function FormsPanel() {
  return (
    <div className="forms-grid">
      <IntakeForm />
      <FeedbackForm />
      <SupportForm />
    </div>
  )
}

function IntakeForm() {
  const [status, setStatus] = useState<FormStatus>(INITIAL_STATUS)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    mode: 'onBlur',
  })

  const onSubmit = (values: IntakeFormValues) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('intake-submission', values)
        setStatus({
          success: true,
          message: 'تم استلام طلب المتابعة. سنراسلُك خلال ساعات.',
        })
        reset()
        resolve()
      }, 600)
    })
  }

  return (
    <form className="chat-form" onSubmit={handleSubmit(onSubmit)}>
      <h3>نموذج ما قبل الجلسة</h3>
      <p className="chat-form-sub">يساعدنا على تجهيز خطة واضحة قبل اتصالك.</p>

      <label className="chat-label">
        الاسم الكامل
        <input className="chat-input" type="text" {...register('fullName')} />
        {errors.fullName && (
          <span className="chat-error">{errors.fullName.message}</span>
        )}
      </label>

      <label className="chat-label">
        البريد الإلكتروني
        <input className="chat-input" type="email" {...register('email')} />
        {errors.email && (
          <span className="chat-error">{errors.email.message}</span>
        )}
      </label>

      <label className="chat-label">
        رقم الهاتف أو الواتساب
        <input className="chat-input" type="tel" {...register('phone')} />
        {errors.phone && (
          <span className="chat-error">{errors.phone.message}</span>
        )}
      </label>

      <label className="chat-label">
        ما هو التحدي أو الهدف الرئيسي حاليًا؟
        <textarea className="chat-input" rows={4} {...register('focus')} />
        {errors.focus && (
          <span className="chat-error">{errors.focus.message}</span>
        )}
      </label>

      <label className="chat-label">
        هل تفضّلين فترة معينة للاتصال؟
        <input
          className="chat-input"
          type="text"
          placeholder="مثال: مساء الثلاثاء أو صباح السبت"
          {...register('preferredSlot')}
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary chat-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
      </button>
      {status.message && (
        <p className={`chat-status${status.success ? ' is-success' : ''}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}

function FeedbackForm() {
  const [status, setStatus] = useState<FormStatus>(INITIAL_STATUS)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onSubmit',
  })

  const onSubmit = (values: FeedbackFormValues) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('feedback-submission', values)
        setStatus({
          success: true,
          message:
            'شكراً على ملاحظاتك! سنأخذها بعين الاعتبار في الجلسة القادمة.',
        })
        reset()
        resolve()
      }, 600)
    })
  }

  return (
    <form className="chat-form" onSubmit={handleSubmit(onSubmit)}>
      <h3>تقييم جلسة سابقة</h3>
      <p className="chat-form-sub">شاركي ما نجح وما يحتاج دعماً إضافيًا.</p>

      <label className="chat-label">
        اسمك أو رمز الجلسة
        <input className="chat-input" type="text" {...register('sessionCode')} />
        {errors.sessionCode && (
          <span className="chat-error">{errors.sessionCode.message}</span>
        )}
      </label>

      <label className="chat-label">
        تقييمك للجلسة (1 - 5)
        <input
          className="chat-input"
          type="number"
          min={1}
          max={5}
          {...register('rating', { valueAsNumber: true })}
        />
        {errors.rating && (
          <span className="chat-error">{errors.rating.message}</span>
        )}
      </label>

      <label className="chat-label">
        أبرز ما أعجبك
        <textarea className="chat-input" rows={3} {...register('highlight')} />
      </label>

      <label className="chat-label">
        ما الذي تريدين التركيز عليه لاحقًا؟
        <textarea className="chat-input" rows={3} {...register('nextFocus')} />
        {errors.nextFocus && (
          <span className="chat-error">{errors.nextFocus.message}</span>
        )}
      </label>

      <button
        type="submit"
        className="btn btn-primary chat-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
      </button>
      {status.message && (
        <p className={`chat-status${status.success ? ' is-success' : ''}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}

function SupportForm() {
  const [status, setStatus] = useState<FormStatus>(INITIAL_STATUS)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    mode: 'onBlur',
  })

  const onSubmit = (values: SupportFormValues) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('support-submission', values)
        setStatus({
          success: true,
          message: 'وصلنا طلب الدعم وسنرد خلال 12 ساعة عمل.',
        })
        reset()
        resolve()
      }, 600)
    })
  }

  return (
    <form className="chat-form" onSubmit={handleSubmit(onSubmit)}>
      <h3>طلب دعم تقني أو إداري</h3>
      <p className="chat-form-sub">
        للمشكلات المتعلقة بالدفع، التحميل، أو تحديث البيانات.
      </p>

      <label className="chat-label">
        موضوع المشكلة
        <input
          className="chat-input"
          type="text"
          placeholder="مثال: مشكلة في الدفع"
          {...register('topic')}
        />
        {errors.topic && (
          <span className="chat-error">{errors.topic.message}</span>
        )}
      </label>

      <label className="chat-label">
        وصف مختصر
        <textarea className="chat-input" rows={4} {...register('message')} />
        {errors.message && (
          <span className="chat-error">{errors.message.message}</span>
        )}
      </label>

      <label className="chat-label">
        رابط مرفق (إن وجد)
        <input
          className="chat-input"
          type="url"
          placeholder="رابط صورة أو ملف"
          {...register('attachment')}
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary chat-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
      </button>
      {status.message && (
        <p className={`chat-status${status.success ? ' is-success' : ''}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}
