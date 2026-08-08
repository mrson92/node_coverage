import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { extractBearer, signToken, verifyCredentials, verifyToken } from "../services/auth";
import type { AuthUser } from "../services/auth";

const router = Router();

interface AuthedRequest extends Request {
  user?: AuthUser;
}

// 전역 우회 경로(health)와 인증 필요한 API 라우팅에 사용하는 헬퍼
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "인증이 필요합니다. 로그인해 주세요." });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "세션이 만료되었거나 유효하지 않습니다." });
    return;
  }
  (req as AuthedRequest).user = {
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
  next();
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email과 password를 모두 입력해 주세요." });
    return;
  }
  const user = verifyCredentials(email, password);
  if (!user) {
    res.status(401).json({ error: "이메일 또는 암호가 올바르지 않습니다." });
    return;
  }
  const token = signToken(user);
  res.json({ token, user });
}

export function meHandler(req: Request, res: Response): void {
  const user = (req as AuthedRequest).user;
  res.json({ user });
}

router.post("/auth/login", loginHandler);
router.get("/auth/me", requireAuth, meHandler);

export default router;