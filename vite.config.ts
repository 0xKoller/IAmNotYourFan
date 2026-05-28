import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isConsole = mode === 'console';

  return {
    plugins: [preact()],
    build: {
      cssCodeSplit: false,
      minify: 'esbuild',
      rollupOptions: isConsole
        ? {
            input: 'src/main.tsx',
            output: {
              format: 'iife',
              name: 'Iamnotyourfan',
              entryFileNames: 'iamnotyourfan-console.js',
              manualChunks: undefined,
            },
          }
        : {
            output: {
              manualChunks: undefined,
            },
          },
    },
    define: {
      'import.meta.env.CONSOLE_MODE': JSON.stringify(isConsole),
    },
  };
});
