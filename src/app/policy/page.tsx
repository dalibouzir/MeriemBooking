'use client'

export default function PolicyPage() {
  return (
    <div dir="rtl" lang="ar" className="container" style={{ padding: '24px 16px', maxWidth: '900px', margin: '0 auto' }}>
      <article className="glass-water" style={{ padding: '32px 24px', borderRadius: 16 }}>
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))', marginBottom: '0.5rem' }}>
            آخر تحديث: ٢٠ ديسمبر ٢٠٢٥
          </p>
          <h1 style={{ marginTop: 0, fontSize: '2rem', fontWeight: 700 }}>الشروط والأحكام</h1>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١. نطاق الخدمات
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            يقدِّم موقع <strong>فطرة الأمهات (Fittrah Moms)</strong> خدمات إرشادية وتعليمية تشمل:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>جلسات إرشاد فردية عبر مكالمات الفيديو</li>
            <li>ملفات ومواد تعليمية قابلة للتحميل (مجانية ومدفوعة)</li>
            <li>برامج تدريبية وورش عمل</li>
            <li>محتوى معرفي وتوعوي</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٢. إخلاء المسؤولية الطبية والنفسية (مهم جدًا)
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            <strong>⚠️ تنبيه مهم:</strong> الخدمات المُقدَّمة عبر هذا الموقع هي خدمات <strong>إرشادية وتعليمية</strong> 
            تهدف إلى الدعم العاطفي والتوجيه العام.
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2, marginBottom: '1rem' }}>
            <li><strong>ليست بديلًا</strong> عن العلاج النفسي أو الاستشارة الطبية المتخصصة.</li>
            <li><strong>لا تُشكِّل</strong> تشخيصًا طبيًا أو نفسيًا.</li>
            <li><strong>لا تُغني</strong> عن مراجعة الطبيب أو المعالج النفسي عند الحاجة.</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
            إذا كنتِ تعانين من أعراض نفسية حادة أو أفكار إيذاء النفس، يُرجى التواصل مع متخصص فورًا.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٣. الملكية الفكرية
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            جميع المحتويات على هذا الموقع — بما في ذلك النصوص والصور والملفات والتصاميم والشعارات — 
            هي ملك لـ <strong>فطرة الأمهات / مريم بوزير</strong> أو مرخَّصة لها.
          </p>
          <p style={{ lineHeight: 1.8 }}>
            <strong>يُمنع منعًا باتًا:</strong>
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>إعادة نشر أو بيع المواد المدفوعة أو المجانية دون إذن خطي.</li>
            <li>مشاركة روابط التحميل المباشرة مع الآخرين.</li>
            <li>نسخ المحتوى لأغراض تجارية.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٤. مسؤوليات المستخدم
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>باستخدامك للموقع، توافقين على:</p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>تقديم معلومات صحيحة ودقيقة عند التسجيل أو الحجز.</li>
            <li>عدم استخدام الموقع لأغراض غير مشروعة أو مسيئة.</li>
            <li>عدم محاولة الوصول غير المصرَّح به إلى أي جزء من الموقع.</li>
            <li>احترام خصوصية الجلسات وعدم تسجيلها أو مشاركتها.</li>
            <li>الحفاظ على سرية رموز التحميل وعدم مشاركتها.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٥. الحجوزات والمواعيد
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            تتم جدولة الجلسات عبر منصة <strong>Calendly</strong>. بحجزك لموعد، توافقين على:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li><strong>الالتزام بالموعد:</strong> يُرجى الحضور في الوقت المحدد.</li>
            <li><strong>الإلغاء أو التعديل:</strong> يُسمح بذلك قبل ٢٤ ساعة على الأقل من الموعد عبر رابط Calendly.</li>
            <li><strong>عدم الحضور:</strong> في حالة عدم الحضور دون إشعار مسبق، قد يُلغى الحجز.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٦. المدفوعات والاسترداد
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            <strong>إن وُجدت خدمات مدفوعة:</strong>
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>تتم المدفوعات عبر بوابات دفع آمنة (مثل Stripe).</li>
            <li>الأسعار تشمل جميع الرسوم المُعلَنة.</li>
            <li><strong>سياسة الاسترداد:</strong> يُنظر في طلبات الاسترداد حسب كل حالة. 
              لا يُسترد المبلغ بعد تقديم الخدمة (مثل عقد الجلسة أو تحميل الملف).</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem', fontSize: '0.95rem' }}>
            للاستفسار عن الاسترداد: meriembouzir05@gmail.com
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٧. السرية وحدود المسؤولية
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            نلتزم بالسرية التامة في جميع الجلسات. ومع ذلك:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>المعلومات المشاركة في الجلسات تبقى سرية ولا تُفشى لأي طرف ثالث.</li>
            <li>قد نُلزَم قانونيًا بالإفصاح في حالات الخطر الوشيك على النفس أو الآخرين.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٨. حدود المسؤولية
          </h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            يُقدَّم الموقع والخدمات "كما هي". لا نضمن:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
            <li>نتائج محددة من الجلسات أو المواد التعليمية.</li>
            <li>خلو الموقع من الأخطاء التقنية أو الانقطاعات.</li>
            <li>دقة أو اكتمال المعلومات لكل الحالات الفردية.</li>
          </ul>
          <p style={{ lineHeight: 1.8, marginTop: '1rem' }}>
            <strong>الحد الأقصى للمسؤولية:</strong> لن نكون مسؤولين عن أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام الموقع أو الخدمات.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ٩. روابط الطرف الثالث
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            قد يحتوي الموقع على روابط لمواقع خارجية (مثل Calendly، YouTube، Instagram). 
            لسنا مسؤولين عن محتوى أو سياسات تلك المواقع.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١٠. القانون الواجب التطبيق
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            تخضع هذه الشروط للقانون الفرنسي. أي نزاع ينشأ عن استخدام الموقع يختص به القضاء الفرنسي.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١١. تعديل الشروط
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. ستُنشر التعديلات على هذه الصفحة مع تحديث تاريخ "آخر تحديث". 
            استمرارك في استخدام الموقع بعد التعديل يُعدّ قبولًا للشروط الجديدة.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--primary-700))' }}>
            ١٢. التواصل
          </h2>
          <p style={{ lineHeight: 1.8 }}>
            لأي استفسارات أو شكاوى تتعلق بهذه الشروط، يُرجى التواصل عبر:
          </p>
          <ul style={{ paddingRight: '1.5rem', lineHeight: 2, marginTop: '0.75rem' }}>
            <li><strong>البريد الإلكتروني:</strong> meriembouzir05@gmail.com</li>
            <li><strong>واتساب:</strong> +33 6 65 28 63 68</li>
          </ul>
        </section>

        <footer style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-dim))' }}>
            باستخدامك لهذا الموقع، فإنك توافق على هذه الشروط والأحكام.
          </p>
        </footer>
      </article>
    </div>
  )
}
