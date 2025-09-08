import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Configure next-intl with request configuration path
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  /* config options here */
}

export default withNextIntl(nextConfig)
