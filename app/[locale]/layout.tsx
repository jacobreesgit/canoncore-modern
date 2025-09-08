import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Geist, Geist_Mono } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Await params in Next.js 15 (Context7 best practice)
  const { locale } = await params
  
  // Validate locale parameter (Next-intl best practice)
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Get messages for the locale (Next-intl best practice)
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}