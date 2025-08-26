// src/app/layout.tsx
// ————————————————————————————————————————————————
// تخطيط عام للتطبيق: شريط علوي (سَكَن) + روابط عربية
// يظهر في كل الصفحات، مع سِمة بنفسجية فاتحة وخلفية متدرجة
// ————————————————————————————————————————————————

import Link from 'next/link'
import type { ReactNode } from 'react'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar">
      <body>
        {/* ░ شريط علوي ثابت: شعار "سَكَن" + روابط عربية ░ */}
        <header className="topbar">
          <div className="container">
            <Link href="/" className="brand" aria-label="الرجوع للصفحة الرئيسية — سَكَن">
              <span className="brand-mark">سَكَن</span>
            </Link>
            <nav className="nav">
              <Link href="/free-call" className="nav-link">مكالمة 1:1</Link>
              <Link href="/download" className="nav-link">التنزيلات</Link>
              <Link href="/دخول" className="nav-link nav-login">دخول</Link>
            </nav>
          </div>
        </header>

        {/* مسافة علوية بسيطة حتى لا تختفي البداية تحت الشريط الثابت */}
        <main className="page-wrap">
          {children}
        </main>

        {/* ░ أنماط عامّة (السِّمة + الشريط) ░ */}
        <style>{`
          :root{
            --purple-50:#faf5ff; --purple-100:#f3e8ff; --purple-200:#e9d5ff;
            --purple-300:#d8b4fe; --purple-400:#c084fc; --purple-500:#a855f7;
            --purple-700:#7c3aed; --text:#2d2a32; --muted:#5e5a67; --white:#fff;
            --shadow-1:0 10px 30px rgba(0,0,0,.08); --shadow-2:0 14px 40px rgba(0,0,0,.12);
          }
          html,body{
            margin:0; padding:0;
            font-family:'Tajawal', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            color:var(--text);
            background:radial-gradient(circle at 20% -10%, var(--purple-100) 0%, var(--purple-400) 120%);
            background-attachment:fixed;
          }
          a{ color:inherit; text-decoration:none }
          .container{ max-width:1100px; margin:0 auto; padding:0 16px }

          .topbar{
            position:sticky; top:0; z-index:40;
            background:rgba(255,255,255,0.7);
            backdrop-filter:blur(10px);
            box-shadow:var(--shadow-1);
          }
          .topbar .container{
            display:flex; align-items:center; justify-content:space-between;
            height:64px;
          }
          .brand{ display:inline-flex; align-items:center; gap:10px; font-weight:900; letter-spacing:.5px }
          .brand-mark{
            display:inline-block;
            background:linear-gradient(90deg, var(--purple-700), var(--purple-500));
            -webkit-background-clip:text; background-clip:text; color:transparent;
            font-size:1.4rem;
          }
          .nav{ display:flex; align-items:center; gap:8px }
          .nav-link{
            display:inline-flex; align-items:center; justify-content:center;
            height:38px; padding:0 14px; border-radius:12px;
            background:var(--white); border:1px solid rgba(0,0,0,.06);
            box-shadow:var(--shadow-1); font-weight:700;
            transition:transform .15s ease, box-shadow .15s ease;
          }
          .nav-link:hover{ transform:translateY(-2px); box-shadow:var(--shadow-2) }
          .nav-login{ color:var(--purple-700); border-color:var(--purple-300) }

          .page-wrap{ padding-top: 14px; }
        `}</style>
      </body>
    </html>
  )
}
