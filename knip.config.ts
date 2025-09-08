import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['app/**/*.{ts,tsx}', 'lib/**/*.ts', 'components/**/*.{ts,tsx}'],
  ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  ignoreDependencies: [
    '@types/*',
    // Next.js ecosystem dependencies that knip can't detect properly
    'eslint-config-next', // Used in eslint.config.mjs via next/core-web-vitals and next/typescript
    'tailwindcss', // Used throughout entire app via CSS classes and postcss.config.mjs
    'tw-animate-css', // Used in app/globals.css for animation utilities
  ],
}

export default config
