import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CanonCore - Content Universe Management',
  description: 'Organize your content universes and franchises',
}

// Generate static params for all locales (Next-intl best practice)
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
