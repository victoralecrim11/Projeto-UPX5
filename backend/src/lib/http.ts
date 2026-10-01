import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const notFound = (entity: string) => new HttpError(404, `${entity} não encontrado(a).`);

/** Valida o corpo da requisição com um schema zod e devolve os dados tipados. */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos.',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
