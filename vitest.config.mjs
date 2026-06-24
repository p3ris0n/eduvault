import { fileURLToPath } from 'url';

export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js', './src/test/setup.js'],
    globals: true,
    include: [
      'src/**/*.test.{js,jsx,mjs,cjs,ts,tsx}',
      'test/**/*.test.{js,jsx,mjs,cjs,ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'tests/**',
      'archive/**',
    ],
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }
    ],
  },
};
