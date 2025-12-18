import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync, rmSync } from 'fs';

// Custom plugin to copy manifest and icons to dist, and fix file structure
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // Copy manifest.json
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

      // Copy icons
      const iconsDir = resolve(distDir, 'icons');
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }

      const publicIcons = resolve(__dirname, 'public/icons');
      if (existsSync(publicIcons)) {
        for (const size of ['16', '48', '128']) {
          const iconFile = `icon${size}.png`;
          const src = resolve(publicIcons, iconFile);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, iconFile));
          }
        }
      }

      // Copy content script CSS (it's a standalone file)
      const contentCssSrc = resolve(__dirname, 'src/content/styles.css');
      const contentDir = resolve(distDir, 'content');
      if (!existsSync(contentDir)) {
        mkdirSync(contentDir, { recursive: true });
      }
      if (existsSync(contentCssSrc)) {
        copyFileSync(contentCssSrc, resolve(contentDir, 'styles.css'));
      }

      // Fix sidepanel location: move from src/sidepanel to sidepanel
      const srcSidepanelDir = resolve(distDir, 'src/sidepanel');
      const sidepanelDir = resolve(distDir, 'sidepanel');

      if (!existsSync(sidepanelDir)) {
        mkdirSync(sidepanelDir, { recursive: true });
      }

      if (existsSync(srcSidepanelDir)) {
        const htmlSrc = resolve(srcSidepanelDir, 'index.html');
        if (existsSync(htmlSrc)) {
          // Read and fix the HTML
          let htmlContent = readFileSync(htmlSrc, 'utf-8');
          // Fix the script path
          htmlContent = htmlContent.replace(
            /<script type="module" crossorigin src="[^"]+"><\/script>/,
            '<script type="module" src="./sidepanel.js"></script>\n  <link rel="stylesheet" href="./styles.css">'
          );
          // Remove any incorrect CSS links
          htmlContent = htmlContent.replace(
            /<link rel="stylesheet" crossorigin href="[^"]*">/g,
            ''
          );
          writeFileSync(resolve(sidepanelDir, 'index.html'), htmlContent);
        }
      }

      // Clean up src directory in dist
      const srcDir = resolve(distDir, 'src');
      if (existsSync(srcDir)) {
        rmSync(srcDir, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [preact(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false, // Bundle all CSS together for sidepanel
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background/index.js';
          if (chunkInfo.name === 'content') return 'content/index.js';
          return 'sidepanel/sidepanel.js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'sidepanel/styles.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    sourcemap: false,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
