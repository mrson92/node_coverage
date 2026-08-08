import React, { useState, useEffect } from "react";
import {
  Network,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const TOKEN_KEY = "node-coverage-token";
const DEMO_EMAIL = "demo@nodecov.io";
const DEMO_PASSWORD = "demo1234";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface AuthScreenProps {
  onLogin: () => void;
}

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

// 저장된 토큰이 유효한지 서버에 확인
export async function isServerSessionValid(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 마운트 시 저장된 세션이 유효하면 바로 진입
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = readStoredToken();
      if (token && (await isServerSessionValid(token))) {
        if (!cancelled) onLogin();
      } else if (token) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [onLogin]);

  if (checking) {
    return (
      <div className="relative min-h-screen bg-[#080808] text-[#cccccc] font-sans flex items-center justify-center px-4 py-10">
        <Spinner />
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setLoginError("유효한 이메일 주소를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "인증에 실패했습니다.");
        return;
      }
      const token: string = data.token;
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
      onLogin();
    } catch {
      setLoginError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const loginFieldInvalid = !!loginError;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-[#cccccc] font-sans selection:bg-[#A1824A]/30 selection:text-white flex flex-col items-center justify-center px-4 py-10">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[420px] rounded-full bg-[#A1824A]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[420px] rounded-full bg-[#A1824A]/5 blur-[120px]" />

      {/* Brand header */}
      <div className="relative mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-[#A1824A]/10 text-[#A1824A] border border-[#A1824A]/25 shadow-md shadow-black/40">
            <Network className="size-5 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif italic tracking-tight text-[#A1824A] leading-none">
                Node Coverage Analyzer
              </span>
            </div>
            <h1 className="text-[11px] text-gray-500 mt-1.5 tracking-wide">
              제품 전 생애주기 통합형 노드 커버리지 분석 대시보드
            </h1>
          </div>
        </div>
        <Badge variant="outline" className="border-[#A1824A]/30 text-[#A1824A] font-mono gap-1.5 mt-1">
          <ShieldCheck className="size-3" />
          SERVER-SIDE SECURE GATEWAY
        </Badge>
      </div>

      <Card className="relative w-full max-w-md border-[#222] bg-[#0c0c0c]/90 shadow-2xl shadow-black/60 ring-[#A1824A]/10">
        <CardHeader className="border-b border-[#111]">
          <CardTitle className="text-[#A1824A] text-base tracking-wide font-sans">회원 로그인</CardTitle>
          <CardDescription className="text-gray-500">
            서버 세션 기반 인증입니다. 등록된 이메일 주소와 암호를 입력하여 대시보드에 접속하십시오.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleLoginSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={loginFieldInvalid}>
                <FieldLabel htmlFor="login-email" className="text-gray-400">
                  <Mail className="size-3.5 text-[#A1824A]" />
                  이메일 주소
                </FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="h-9 bg-[#080808] text-stone-200 border-[#222] focus:border-[#A1824A]/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={loginFieldInvalid}
                />
              </Field>

              <Field data-invalid={loginFieldInvalid}>
                <FieldLabel htmlFor="login-password" className="text-gray-400">
                  <KeyRound className="size-3.5 text-[#A1824A]" />
                  암호
                </FieldLabel>
                <InputGroup className="h-11 bg-[#080808] border-[#222] focus-within:border-[#A1824A]/60">
                  <InputGroupInput
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="text-stone-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={loginFieldInvalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-400 hover:text-[#A1824A] hover:bg-transparent"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "암호 숨기기" : "암호 보기"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field orientation="horizontal" className="gap-2">
                <Checkbox
                  id="remember-me"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                />
                <FieldLabel htmlFor="remember-me" className="font-normal text-gray-400 text-xs">
                  로그인 상태 유지
                </FieldLabel>
              </Field>

              {loginError && (
                <Alert variant="destructive">
                  <ShieldCheck />
                  <AlertTitle>로그인 실패</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white font-bold"
              >
                {submitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <KeyRound data-icon="inline-start" />
                )}
                {submitting ? "서버 인증 중..." : "로그인"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3 bg-transparent border-t border-[#111] pt-4">
          <p className="text-[11px] text-gray-600 font-mono text-center">
            데모 계정&nbsp;
            <code className="text-[#A1824A]">{DEMO_EMAIL}</code> /{" "}
            <code className="text-[#A1824A]">{DEMO_PASSWORD}</code>
          </p>
        </CardFooter>
      </Card>

      <p className="relative mt-6 text-[10px] text-gray-600 font-mono">
        © 2026 Node Coverage Analyzer · 서버 세션 인증 게이트웨이 v2.0 (HMAC-SHA256 서명 토큰, 서버 측 자격 검증)
      </p>
    </div>
  );
}