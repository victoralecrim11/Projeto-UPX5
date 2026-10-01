import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db, type StoredUser } from '../db/store.js';
import { HttpError } from '../lib/http.js';
import type { UserRole } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: StoredUser;
    }
  }
}

interface TokenPayload {
  sub: string;
  role: UserRole;
}

export function signToken(user: StoredUser): string {
  const payload: TokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Exige um Bearer token válido e carrega o usuário em req.user. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de autenticação ausente.');
  }
  let payload: TokenPayload;
  try {
    payload = jwt.verify(header.slice(7), config.jwtSecret) as unknown as TokenPayload;
  } catch {
    throw new HttpError(401, 'Sessão expirada ou token inválido.');
  }
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user || !user.active) {
    throw new HttpError(401, 'Usuário inexistente ou inativo.');
  }
  req.user = user;
  next();
};

/** RBAC: libera a rota somente para os perfis informados. */
export const requireRoles =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'Seu perfil não tem permissão para esta ação.');
    }
    next();
  };

/** Retorna o usuário autenticado (uso dentro de rotas protegidas por authenticate). */
export function currentUser(req: Express.Request): StoredUser {
  if (!req.user) throw new HttpError(401, 'Não autenticado.');
  return req.user;
}
