import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Avoid crashing in browser by defining an empty process.env object
    // Our code already checks for typeof process !== 'undefined' so this is safe
    'process.env': {}
  }
})