import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/snake/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !id.startsWith('/'),
    },
  },
})
