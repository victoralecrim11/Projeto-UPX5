import path from 'node:path';

const DEFAULT_REFERENCE_DATE = '2026-09-29T23:59:59.000Z';

export const config = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? 'ecoia-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
  dbFile: path.resolve(process.env.DB_FILE ?? './data/db.json'),
  referenceDate: process.env.REFERENCE_DATE ?? DEFAULT_REFERENCE_DATE,
  demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
  demoPassword: process.env.DEMO_PASSWORD ?? 'demo123456',
};

/** "Agora" do ponto de vista do motor de análise (fixo nos dados de demonstração). */
export function referenceNow(): Date {
  return config.referenceDate ? new Date(config.referenceDate) : new Date();
}
