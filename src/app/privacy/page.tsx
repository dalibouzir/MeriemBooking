'use client'

import type { Metadata } from 'next'

export default function PrivacyPage() {
  return (
    <div dir="rtl" lang="ar" className="container" style={{ padding: '24px 16px', maxWidth: '900px', margin: '0 auto' }}>
      <article className="glass-water" style={{ padding: '32px 24px', borderRadius: 16 }}>
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))', marginBottom: '0.5rem' }}>
            آخر تحديث: ٢٠ ديسمبر ٢٠٢٥
          </p>
          <h1 style={{ marginTop: 0, fontSize: '2rem', fontWeight: 700 }}>سياسة الخصوصية</h1>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١. من نحن
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            موقع <strong>فطرة الأمهات (Fittrah Moms)</strong> هو منصّة إلكترونية تُقدِّم خدمات الإرشاد العاطفي والدعم النفسي للنساء والأمهات. 
            المسؤولة عن الموقع هي <strong>مريم بوزير</strong>.
          </p>
          <p style={{ lineHeight: 1.8 }}>
            <strong>للتواصل:</strong> meriembouzir05@gmail.com
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٢. المعلومات التي نجمعها
          </h2>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.75rem', marginTop: '1.25rem' }}>
            أ) المعلومات التي تُقدِّمينها طوعًا:
          </h3>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2, marginBottom: '1rem' }}>
            <li>الاسم الأول واللقب</li>
            <li>البريد الإلكتروني</li>
            <li>رقم الهاتف (اختياري)</li>
            <li>البلد (للمساعدة في التواصل)</li>
            <li>تفاصيل الحجز والمواعيد (عبر Calendly)</li>
            <li>محتوى الرسائل المُرسَلة عبر نماذج التواصل</li>
          </ul>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.75rem', marginTop: '1.25rem' }}>
            ب) المعلومات المُجمَّعة تلقائيًا:
          </h3>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2, marginBottom: '1rem' }}>
            <li>عنوان IP</li>
            <li>نوع المتصفح والجهاز</li>
            <li>الصفحات التي تمت زيارتها ومدة الزيارة</li>
            <li>مصدر الزيارة (رابط الإحالة)</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: 'hsl(var(--text-dim))' }}>
            يتم جمع هذه البيانات عبر خدمة Vercel Analytics لتحسين أداء الموقع وتجربة المستخدم.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٣. أغراض استخدام البيانات
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>نستخدم بياناتك للأغراض التالية:</p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>تقديم الخدمات:</strong> إرسال الملفات والموارد التي طلبتِها، وتأكيد حجوزات الجلسات.</li>
            <li><strong>التواصل:</strong> الرد على استفساراتك ومراسلاتك.</li>
            <li><strong>إرسال التذكيرات:</strong> إشعارات المواعيد ورموز التحميل.</li>
            <li><strong>تحسين الموقع:</strong> تحليل الاستخدام لتطوير التجربة.</li>
            <li><strong>الأمان:</strong> حماية الموقع من الاستخدام غير المشروع.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٤. الأساس القانوني للمعالجة
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>نعتمد على الأسس القانونية التالية:</p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>الموافقة:</strong> عند تقديم بياناتك طوعًا عبر النماذج.</li>
            <li><strong>تنفيذ العقد:</strong> لتقديم الخدمات التي طلبتِها (جلسات، ملفات).</li>
            <li><strong>المصالح المشروعة:</strong> تحسين الموقع وضمان أمانه.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٥. مشاركة البيانات مع أطراف ثالثة
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            لا نبيع بياناتك أبدًا. قد نشارك بعض البيانات مع مزوِّدي الخدمات الضروريين:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>Supabase:</strong> استضافة قاعدة البيانات (الاتحاد الأوروبي/الولايات المتحدة)</li>
            <li><strong>Vercel:</strong> استضافة الموقع والتحليلات</li>
            <li><strong>Calendly:</strong> جدولة المواعيد</li>
            <li><strong>Resend:</strong> إرسال رسائل البريد الإلكتروني</li>
            <li><strong>Stripe:</strong> معالجة المدفوعات (إن وُجدت)</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem', fontSize: '0.95rem' }}>
            يخضع كل مزوِّد لسياسة خصوصية خاصة به ويلتزم بمعايير حماية البيانات.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٦. النقل الدولي للبيانات
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            قد تُنقَل بياناتك إلى خوادم خارج بلد إقامتك، بما في ذلك الولايات المتحدة والاتحاد الأوروبي. 
            نحرص على أن يلتزم مزوِّدو الخدمات بالبنود التعاقدية القياسية (SCCs) وآليات الحماية المناسبة.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٧. مدة الاحتفاظ بالبيانات
          </h2>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>بيانات التواصل والحجز:</strong> نحتفظ بها لمدة ٣ سنوات من آخر تفاعل.</li>
            <li><strong>سجلات التحليلات:</strong> تُحذف تلقائيًا بعد ٢٦ شهرًا.</li>
            <li><strong>رسائل البريد الإلكتروني:</strong> تُحفَظ طالما دعت الحاجة للمتابعة.</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem' }}>
            يمكنك طلب حذف بياناتك في أي وقت بمراسلتنا.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٨. حقوقك
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>يحقّ لك:</p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>الوصول:</strong> طلب نسخة من بياناتك الشخصية.</li>
            <li><strong>التصحيح:</strong> تعديل البيانات غير الدقيقة.</li>
            <li><strong>الحذف:</strong> طلب حذف بياناتك ("الحق في النسيان").</li>
            <li><strong>الاعتراض:</strong> الاعتراض على معالجة معينة.</li>
            <li><strong>النقل:</strong> الحصول على بياناتك بصيغة قابلة للقراءة آليًا.</li>
            <li><strong>سحب الموافقة:</strong> التراجع عن موافقتك في أي وقت.</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem' }}>
            لممارسة أي من هذه الحقوق، راسلينا على: <strong>meriembouzir05@gmail.com</strong>
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٩. خصوصية الأطفال
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            هذا الموقع غير مُوجَّه للأطفال دون سن ١٦ عامًا. لا نجمع عن علم معلومات شخصية من القاصرين. 
            إذا علمنا بجمع بيانات طفل، سنحذفها فورًا.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١٠. ملفات تعريف الارتباط (الكوكيز)
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>نستخدم أنواعًا محدودة من الكوكيز:</p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>الكوكيز الضرورية:</strong> لتشغيل الموقع بشكل صحيح (مثل حفظ جلسة المستخدم).</li>
            <li><strong>كوكيز التحليلات:</strong> لفهم كيفية استخدام الموقع (Vercel Analytics) — لا تُستخدم للإعلانات.</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem' }}>
            <strong>إدارة الكوكيز:</strong> يمكنك ضبط إعدادات المتصفح لحظر الكوكيز أو حذفها. 
            قد يؤثر ذلك على بعض وظائف الموقع.
          </p>
          <p style={{ lineHeight: 1.8, marginTop: '0.75rem', fontSize: '0.95rem', color: 'hsl(var(--text-dim))' }}>
            باستمرارك في استخدام الموقع، فإنك توافق على استخدام الكوكيز الضرورية والتحليلية كما هو موضَّح أعلاه.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١١. الأمان
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            نطبِّق تدابير أمنية تقنية وإدارية لحماية بياناتك، تشمل:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>تشفير الاتصال عبر HTTPS</li>
            <li>تخزين آمن لقواعد البيانات</li>
            <li>وصول محدود للبيانات الحساسة</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem', fontSize: '0.95rem' }}>
            رغم حرصنا، لا يمكن ضمان أمان مطلق عبر الإنترنت.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١٢. تحديثات السياسة
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            قد نُحدِّث هذه السياسة من وقت لآخر. سنُعلن عن التغييرات الجوهرية عبر الموقع أو البريد الإلكتروني. 
            استمرارك في استخدام الموقع بعد التحديث يُعدّ قبولًا للسياسة الجديدة.
          </p>
        </section>

        <footer style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-dim))' }}>
            للاستفسارات المتعلقة بالخصوصية: <strong>meriembouzir05@gmail.com</strong>
          </p>
        </footer>
      </article>
    </div>
  )
}
