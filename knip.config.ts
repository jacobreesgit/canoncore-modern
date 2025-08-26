const config = {
  ignore: [
    // Test mock files that provide runtime replacements
    'test/mocks/server-only.ts',
  ],
  ignoreDependencies: [
    // These are actually used but may not be detected properly
    'tailwindcss', // Used in styling
    'lighthouse', // Used in performance testing scripts
    'web-vitals', // Used in performance monitoring
    'eslint-config-next', // Used in eslint.config.mjs
  ],
}

export default config
