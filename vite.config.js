import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [wasm()],
  server: {
    middlewareMode: false,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
        next();
      });
    }
  }
});