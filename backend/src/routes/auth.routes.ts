import { Router } from 'express';
import { config } from '../config.js';
import { db, nowIso, persist, toPublicUser } from '../db/store.js';
import { HttpError, parseBody } from '../lib/http.js';
import { verifyPassword } from '../lib/password.js';
import { authenticate, currentUser, signToken } from '../middleware/auth.js';
import { loginSchema, switchRoleSchema } from '../schemas.js';
import { audit } from '../services/audit.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = parseBody(loginSchema, req.body);
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'E-mail ou senha inválidos.');
  }
  if (!user.active) {
    throw new HttpError(403, 'Usuário desativado. Procure um administrador.');
  }
  user.lastLogin = nowIso();
  persist();
  res.json({ token: signToken(user), user: toPublicUser(user) });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: toPublicUser(currentUser(req)) });
});

/** Troca rápida de perfil, disponível apenas no modo demonstração. */
authRouter.post('/switch-role', authenticate, (req, res) => {
  if (!config.demoMode) {
    throw new HttpError(403, 'Troca de perfil disponível apenas no modo demonstração.');
  }
  const { role } = parseBody(switchRoleSchema, req.body);
  const target = db.users.find((u) => u.role === role && u.active);
  if (!target) throw new HttpError(404, `Nenhum usuário ativo com o perfil ${role}.`);

  audit(target, {
    action: 'Troca de Perfil de Usuário',
    entity: 'UserSession',
    entityId: target.id,
    details: `Sessão alterada para o perfil ${target.role} (${target.name}).`,
  });
  persist();
  res.json({ token: signToken(target), user: toPublicUser(target) });
});
