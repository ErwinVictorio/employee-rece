import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: { include: ['three', '@react-three/fiber'] },
  server: { watch: { ignored: ['**/.browser-check/**', '**/artifacts/**'] } },
  plugins: [react()],
})
