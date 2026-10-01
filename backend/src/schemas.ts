import { z } from 'zod';

const scope = z.enum(['ORGANIZACAO', 'UNIDADE', 'PONTO']);
const role = z.enum(['ADMIN', 'GESTOR', 'OPERACAO', 'FINANCEIRO']);
const isoDate = z.string().min(1);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const switchRoleSchema = z.object({ role });

export const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  role,
  unitId: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const userUpdateSchema = z
  .object({
    name: z.string().min(1),
    role,
    unitId: z.string(),
    active: z.boolean(),
    password: z.string().min(6),
  })
  .partial();

export const pointCreateSchema = z.object({
  unitId: z.string().min(1),
  name: z.string().min(1),
  meterIdentifier: z.string().min(1),
  type: z.enum(['CLIMATIZACAO', 'ILUMINACAO', 'PRODUCAO', 'DATA_CENTER', 'SUBESTACAO', 'GERAL']),
  location: z.string(),
  status: z.enum(['ATIVO', 'INATIVO']),
  operatingSchedule: z
    .object({
      weekdays: z.array(z.number().int().min(0).max(6)),
      startHour: z.number().int().min(0).max(24),
      endHour: z.number().int().min(0).max(24),
    })
    .optional(),
  hasInsufficientHistory: z.boolean().optional(),
});
export const pointUpdateSchema = pointCreateSchema.partial();

export const recordCreateSchema = z.object({
  pointId: z.string().min(1),
  value: z.number(),
  timestamp: isoDate,
  notes: z.string().optional(),
});

export const recordUpdateSchema = z
  .object({
    value: z.number().min(0),
    timestamp: isoDate,
    notes: z.string().optional(),
    status: z.enum(['NORMAL', 'ANOMALIA']),
  })
  .partial();

export const treatAlertSchema = z.object({
  observation: z.string().min(1),
  action: z.string().min(1),
});

export const goalCreateSchema = z.object({
  name: z.string().min(1),
  scope,
  targetEntityId: z.string().optional(),
  targetKwh: z.number().positive(),
  period: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
  status: z.enum(['NO_LIMITE', 'ATENCAO', 'EXCEDIDA']).default('NO_LIMITE'),
});
export const goalUpdateSchema = goalCreateSchema.partial();

export const tariffCreateSchema = z.object({
  name: z.string().min(1),
  scope,
  targetEntityId: z.string().optional(),
  ratePerKwh: z.number().positive(),
  currency: z.literal('BRL').default('BRL'),
  demandRate: z.number().nonnegative().optional(),
  effectiveFrom: isoDate,
  effectiveTo: z.string().optional(),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});
export const tariffUpdateSchema = tariffCreateSchema.partial();

export const automationCreateSchema = z.object({
  name: z.string().min(1),
  condition: z.enum(['DESVIO_MAIOR_QUE', 'CONSUMO_OCIOSO', 'META_ATINGIDA']),
  thresholdPercent: z.number().nonnegative().optional(),
  scope,
  targetId: z.string().optional(),
  digitalAction: z.enum([
    'NOTIFICAR_GESTOR',
    'CRIAR_OCORRENCIA',
    'GERAR_RELATORIO',
    'ALTERAR_STATUS_ALERTA',
  ]),
  recipients: z.array(z.string()).min(1),
  active: z.boolean().default(true),
});

export const thresholdsSchema = z
  .object({
    mediumThresholdPercent: z.number().positive(),
    highThresholdPercent: z.number().positive(),
    minHistoryDays: z.number().int().positive(),
  })
  .refine((t) => t.highThresholdPercent > t.mediumThresholdPercent, {
    message: 'O limiar alto deve ser maior que o limiar médio.',
    path: ['highThresholdPercent'],
  });
