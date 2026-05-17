import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse } from 'http';

// Simple in-memory session store for development
const devSessions = new Map<string, { authorized: boolean; bypass?: boolean }>();
const DEV_PASSCODE = '5947';

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      // Parse JSON body helper
      const parseBody = (req: IncomingMessage): Promise<any> => {
        return new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try { resolve(JSON.parse(body)); } 
            catch { resolve({}); }
          });
        });
      };

      // Get session from cookie
      const getSession = (req: IncomingMessage) => {
        const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>) || {};
        return cookies['smeemo_session'] ? devSessions.get(cookies['smeemo_session']) : null;
      };

      // Set session cookie
      const setSession = (res: ServerResponse, authorized: boolean, bypass = false) => {
        const id = Math.random().toString(36).slice(2);
        devSessions.set(id, { authorized, bypass });
        res.setHeader('Set-Cookie', `smeemo_session=${id}; Path=/; HttpOnly; SameSite=Lax`);
        return id;
      };

      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        
        // POST /api/session - Login
        if (url === '/api/session' && req.method === 'POST') {
          parseBody(req).then(body => {
            const passcode = String(body.passcode || '').trim();
            const envPasscode = process.env.PASSCODE || DEV_PASSCODE;
            if (passcode === envPasscode || passcode === DEV_PASSCODE) {
              setSession(res, true);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'ok' }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid passcode' }));
            }
          });
          return;
        }

        // GET /api/session/check
        if (url === '/api/session/check' && req.method === 'GET') {
          const session = getSession(req);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authorized: session?.authorized || false }));
          return;
        }

        // POST /api/session/bypass
        if (url === '/api/session/bypass' && req.method === 'POST') {
          parseBody(req).then(body => {
            if ((body.attempts || 0) >= 3) {
              setSession(res, true, true);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'ok', bypass: true }));
            } else {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Not yet' }));
            }
          });
          return;
        }

        // DELETE /api/session - Logout
        if (url === '/api/session' && req.method === 'DELETE') {
          res.setHeader('Set-Cookie', 'smeemo_session=; Path=/; HttpOnly; Max-Age=0');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        // GET /api/passcode/helper
        if (url === '/api/passcode/helper' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ hint: 'Smeemo knows the way...' }));
          return;
        }

        // Mock other API endpoints for development
        if (url.startsWith('/api/')) {
          // Default mock response for unhandled API routes
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            _dev: true, 
            _note: 'This is a dev mock. Real API runs on Vercel.',
            entries: [],
            settings: {
              id: 'global',
              dailyGoal: 500,
              weeklyGoal: 3500,
              passcode: DEV_PASSCODE,
              isSetupComplete: true,
              defaultChartView: 'daily'
            }
          }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      devApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon-32.png', 'apple-touch-icon.png', 'smeemo.png'],
        manifest: {
          name: 'Smeemo Writer',
          short_name: 'Smeemo',
          theme_color: '#facc15',
          background_color: '#fdf6f5',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'motion/react'],
            'vendor-utils': ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
