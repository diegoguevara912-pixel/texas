import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ROOT, config, isProd } from './config.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { limits, sameOrigin } from './lib/security.js';
import { renderMeta, sitemap } from './lib/seo.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Hostinger sirve detrás de un proxy inverso

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com'],
          'frame-src': ['https://www.google.com', 'https://maps.google.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
          'worker-src': ["'self'", 'blob:'],
          'upgrade-insecure-requests': isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '300kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api', limits.api, sameOrigin);
  app.use('/api/admin', adminRouter(db));
  app.use('/api', publicRouter(db));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // Archivos subidos: solo lectura, sin listado de carpetas, nunca ejecutables.
  app.use('/uploads', (req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
    next();
  }, express.static(config.uploadDir, { index: false, dotfiles: 'deny', maxAge: '30d', immutable: true }));

  app.get('/sitemap.xml', async (req, res) => res.type('application/xml').send(await sitemap(db)));
  app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${config.publicUrl}/sitemap.xml\n`));

  const dist = path.join(ROOT, 'dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    const cached = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const readTemplate = () => (isProd ? cached : fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
    app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true, setHeaders: (res, p) => p.endsWith('.html') && res.set('Cache-Control', 'no-cache') }));
    app.get(/^\/(?!api\/|uploads\/).*/, async (req, res, next) => {
      try {
        const head = await renderMeta(db, req.path.replace(/\/+$/, '') || '/');
        res.set('Cache-Control', 'no-cache');
        res.send(readTemplate().replace(/<title>[\s\S]*?<\/title>/, '').replace('<!--SEO-->', head));
      } catch (e) {
        next(e);
      }
    });
  }

  // Errores: mensaje genérico al usuario, detalle solo en el registro del servidor.
  app.use((err, req, res, _next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `Archivo demasiado grande (máximo ${config.uploadMaxMb} MB).` });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' });
    console.error(`[error] ${req.method} ${req.path}`, err);
    res.status(500).json({ error: 'Ocurrió un error inesperado. Intente de nuevo.' });
  });

  return app;
}
