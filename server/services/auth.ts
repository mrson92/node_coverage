import crypto from "crypto";

// 데모용 서버 측 인증: 비밀로 서명한 HMAC 토큰 + SSRF 보안 헤더 등
const AUTH_SECRET = process.env.AUTH_SECRET || "node-coverage-insecure-demo-secret";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일

export interface AuthUser {
  email: string;
  name: string;
  role: "admin" | "viewer";
}

const DEMO_USERS: Record<string, { passwordHash: string; name: string; role: "admin" | "viewer" }> = {
  // demo@nodecov.io / demo1234 (SHA-256)
  "demo@nodecov.io": {
    passwordHash: "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d",
    name: "김데모",
    role: "admin",
  },
};

export function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export function verifyCredentials(email: string, password: string): AuthUser | null {
  const account = DEMO_USERS[email.toLowerCase().trim()];
  if (!account) return null;
  if (hashPassword(password) !== account.passwordHash) return null;
  return { email: email.toLowerCase().trim(), name: account.name, role: account.role };
}

// --- Signed token (self-contained, stateless) ---
export interface TokenPayload {
  email: string;
  name: string;
  role: "admin" | "viewer";
  exp: number; // epoch ms
}

export function signToken(payload: Omit<TokenPayload, "exp">, ttlMs: number = TOKEN_TTL_MS): string {
  const body: TokenPayload = { ...payload, exp: Date.now() + ttlMs };
  const bodyB64 = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(bodyB64).digest("base64url");
  return `${bodyB64}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [bodyB64, sig] = parts as [string, string];
  const expectSig = crypto.createHmac("sha256", AUTH_SECRET).update(bodyB64).digest("base64url");
  const a = Buffer.from(expectSig);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(bodyB64, "base64url").toString("utf8")) as TokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractBearer(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match ? match[1] : null;
}