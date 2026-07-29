import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,       // required host port (not Vite's default 5173)
    strictPort: true, // fail loudly if 3000 is taken instead of silently switching
  },
})
