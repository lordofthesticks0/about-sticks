import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const NETLIFY_SITE_ORIGIN = process.env.VITE_NETLIFY_SITE_ORIGIN || 'https://lordofthesticks.netlify.app'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Keep local development on the same deployed Netlify functions and
    // Netlify Blobs data as production. Production builds still use relative
    // function URLs and therefore do not depend on this proxy.
    proxy: {
      '/.netlify/functions': {
        target: NETLIFY_SITE_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
