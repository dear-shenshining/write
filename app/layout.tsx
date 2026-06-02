import type { Metadata } from 'next'
import { Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSerifSC = Noto_Serif_SC({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: '致因爱创作的你们 | 感谢信',
  description: '一封来自"一间属于自己的房间"的感谢信，致敬为128名珍珠生捐款的每一位善心人。',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className={`${notoSerifSC.variable} font-serif antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
