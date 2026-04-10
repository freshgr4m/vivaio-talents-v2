import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_API_FOOTBALL_KEY ?? ''

  return {
    base: '/vivaio-talents-v2/',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api-football': {
          target: 'https://v3.football.api-sports.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-football/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-apisports-key', apiKey)
            })
          },
        },
      },
    },
  }
})
