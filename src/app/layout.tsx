import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'Meriem Booking',
  description: 'Book a free call and download your resources',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      {/* Remove any <link href="https://fonts.googleapis.com"...> from here */}
      <body className={inter.className}>{children}</body>
    </html>
  )
}
