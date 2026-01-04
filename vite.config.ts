import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Changed process.cwd() to '.' to fix TypeScript error.
  const env = loadEnv(mode, '.', '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
        manifest: {
          name: 'GhostSnap',
          short_name: 'GhostSnap',
          description: 'An intelligent tool to automatically detect and blur sensitive information in screenshots. Upload an image, let the AI find PII, and manually adjust blurs before downloading the secure image.',
          theme_color: '#ffffff',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '.',
          icons: [
            {
              src: 'icons/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'icons/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    server: {
      port: 3000,
    },
    // This makes the API_KEY available to the client-side code.
    // Vercel/Netlify will set VITE_API_KEY, and the build will use it.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})