import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pruebas unitarias con Vitest (sintaxis tipo Jasmine: describe / it / expect) sobre jsdom
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    include: ['src/tests/**/*.test.{js,jsx}'],
    css: false,
    // Las pruebas corren siempre en modo local aunque exista un .env.local con el modo servidor
    // (las de modo servidor lo activan ellas mismas con vi.stubEnv)
    env: { VITE_MODO_SERVIDOR: 'false', VITE_API_URL: 'http://localhost:8080' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/tests/**', 'src/main.jsx', 'src/assets/**', 'src/data/regionesChile.js']
    }
  }
})
