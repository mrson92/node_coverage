import React, { useState } from "react";
import {
  Network,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  UserRound,
  Phone,
  ArrowLeft,
  MailCheck,
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type AuthMode = "login" | "password" | "email";

interface AuthUser {
  password: string;
  name: string;
  phone: string;
}

interface AuthScreenProps {
  onLogin: () => void;
}

const USERS_KEY = "node-coverage-users";
const AUTH_KEY = "node-coverage-auth";
const DEMO_EMAIL = "demo@nodecov.io";
const DEMO_PASSWORD = "demo1234";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function loadUsers(): Record<string, AuthUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, AuthUser>;
  } catch {
    // Ignore corrupted storage and re-seed below.
  }
  const seed: Record<string, AuthUser> = {
    [DEMO_EMAIL]: { password: DEMO_PASSWORD, name: "김데모", phone: "010-1234-5678" },
  };
  localStorage.setItem(USERS_KEY, JSON.stringify(seed));
  return seed;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password recovery state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Email recovery state
  const [findName, setFindName] = useState("");
  const [findPhone, setFindPhone] = useState("");
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [findError, setFindError] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setLoginError(null);
    setResetError(null);
    setResetSent(false);
    setFoundEmail(null);
    setFindError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = loadUsers();

    if (!EMAIL_RE.test(email)) {
      setLoginError("유효한 이메일 주소를 입력해 주세요.");
      return;
    }
    const user = users[email.trim().toLowerCase()];
    if (!user || user.password !== password) {
      setLoginError("이메일 또는 암호가 올바르지 않습니다.");
      return;
    }

    setLoginError(null);
    setSubmitting(true);
    window.setTimeout(() => {
      if (remember) {
        localStorage.setItem(AUTH_KEY, "1");
      } else {
        sessionStorage.setItem(AUTH_KEY, "1");
      }
      setSubmitting(false);
      onLogin();
    }, 600);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = loadUsers();
    const target = resetEmail.trim().toLowerCase();

    if (!EMAIL_RE.test(target)) {
      setResetError("유효한 이메일 주소를 입력해 주세요.");
      return;
    }
    if (!users[target]) {
      setResetError("등록된 계정이 없습니다. 이메일 주소를 확인해 주세요.");
      return;
    }
    setResetError(null);
    setResetSent(true);
  };

  const handleFindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = loadUsers();
    const found = Object.entries(users).find(
      ([, u]) => u.name === findName.trim() && u.phone === findPhone.trim()
    );

    if (!found) {
      setFindError("입력한 이름과 연락처와 일치하는 계정을 찾을 수 없습니다.");
      return;
    }
    setFindError(null);
    setFoundEmail(maskEmail(found[0]));
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
          SECURE GATEWAY ACCESS
        </Badge>
      </div>

      <Card className="relative w-full max-w-md border-[#222] bg-[#0c0c0c]/90 shadow-2xl shadow-black/60 ring-[#A1824A]/10">
        <CardHeader className="border-b border-[#111]">
          <CardTitle className="text-[#A1824A] text-base tracking-wide font-sans">
            {mode === "login" && "회원 로그인"}
            {mode === "password" && "암호 찾기"}
            {mode === "email" && "이메일 주소 찾기"}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {mode === "login" && "등록된 이메일 주소와 암호를 입력하여 대시보드에 접속하십시오."}
            {mode === "password" && "가입 시 등록한 이메일 주소로 암호 재설정 안내를 보내드립니다."}
            {mode === "email" && "가입 시 등록한 이름과 연락처로 이메일 주소를 찾아드립니다."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          {mode === "login" && (
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
                  <InputGroup className="h-9 bg-[#080808] border-[#222] focus-within:border-[#A1824A]/60">
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
                  className="w-full h-9 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white font-bold"
                >
                  {submitting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <KeyRound data-icon="inline-start" />
                  )}
                  {submitting ? "인증 확인 중..." : "로그인"}
                </Button>
              </FieldGroup>
            </form>
          )}

          {mode === "password" && (
            <form onSubmit={handleResetSubmit} noValidate>
              <FieldGroup>
                <Field data-invalid={!!resetError}>
                  <FieldLabel htmlFor="reset-email" className="text-gray-400">
                    <Mail className="size-3.5 text-[#A1824A]" />
                    가입 이메일 주소
                  </FieldLabel>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="h-9 bg-[#080808] text-stone-200 border-[#222] focus:border-[#A1824A]/60"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    aria-invalid={!!resetError}
                  />
                </Field>

                {resetError && (
                  <Alert variant="destructive">
                    <ShieldCheck />
                    <AlertTitle>찾기 실패</AlertTitle>
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                {resetSent && (
                  <Alert>
                    <MailCheck />
                    <AlertTitle>재설정 메일 발송 완료</AlertTitle>
                    <AlertDescription>
                      <code className="font-mono text-[#A1824A]">{resetEmail.trim().toLowerCase()}</code>{" "}
                      계정으로 암호 재설정 안내 메일이 발송되었습니다. 메일함을 확인해 주세요.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={resetSent}
                  className="w-full h-9 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white font-bold"
                >
                  <MailCheck data-icon="inline-start" />
                  재설정 링크 보내기
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-fit mx-auto text-gray-400 hover:text-[#A1824A]"
                  onClick={() => switchMode("login")}
                >
                  <ArrowLeft className="size-3.5" />
                  로그인 화면으로 돌아가기
                </Button>
              </FieldGroup>
            </form>
          )}

          {mode === "email" && (
            <form onSubmit={handleFindSubmit} noValidate>
              <FieldGroup>
                <Field data-invalid={!!findError}>
                  <FieldLabel htmlFor="find-name" className="text-gray-400">
                    <UserRound className="size-3.5 text-[#A1824A]" />
                    가입 시 입력한 이름
                  </FieldLabel>
                  <Input
                    id="find-name"
                    type="text"
                    placeholder="홍길동"
                    className="h-9 bg-[#080808] text-stone-200 border-[#222] focus:border-[#A1824A]/60"
                    value={findName}
                    onChange={(e) => setFindName(e.target.value)}
                    aria-invalid={!!findError}
                  />
                </Field>

                <Field data-invalid={!!findError}>
                  <FieldLabel htmlFor="find-phone" className="text-gray-400">
                    <Phone className="size-3.5 text-[#A1824A]" />
                    가입 시 입력한 연락처
                  </FieldLabel>
                  <Input
                    id="find-phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    className="h-9 bg-[#080808] text-stone-200 border-[#222] focus:border-[#A1824A]/60"
                    value={findPhone}
                    onChange={(e) => setFindPhone(e.target.value)}
                    aria-invalid={!!findError}
                  />
                </Field>

                {findError && (
                  <Alert variant="destructive">
                    <ShieldCheck />
                    <AlertTitle>찾기 실패</AlertTitle>
                    <AlertDescription>{findError}</AlertDescription>
                  </Alert>
                )}

                {foundEmail && (
                  <Alert>
                    <CheckCircle2 />
                    <AlertTitle>이메일 주소를 찾았습니다</AlertTitle>
                    <AlertDescription>
                      등록된 이메일 주소는{" "}
                      <code className="font-mono text-[#A1824A]">{foundEmail}</code> 입니다.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={!!foundEmail}
                  className="w-full h-9 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white font-bold"
                >
                  <Mail data-icon="inline-start" />
                  이메일 주소 찾기
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-fit mx-auto text-gray-400 hover:text-[#A1824A]"
                  onClick={() => switchMode("login")}
                >
                  <ArrowLeft className="size-3.5" />
                  로그인 화면으로 돌아가기
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3 bg-transparent border-t border-[#111] pt-4">
          {mode === "login" && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="link"
                  size="sm"
                  className="text-gray-400 hover:text-[#A1824A]"
                  onClick={() => switchMode("password")}
                >
                  암호 찾기
                </Button>
                <Separator orientation="vertical" className="h-4 bg-[#222]" />
                <Button
                  variant="link"
                  size="sm"
                  className="text-gray-400 hover:text-[#A1824A]"
                  onClick={() => switchMode("email")}
                >
                  이메일 주소 찾기
                </Button>
              </div>
              <p className="text-[11px] text-gray-600 font-mono text-center">
                데모 계정&nbsp;
                <code className="text-[#A1824A]">{DEMO_EMAIL}</code> /{" "}
                <code className="text-[#A1824A]">{DEMO_PASSWORD}</code>
              </p>
            </>
          )}
        </CardFooter>
      </Card>

      <p className="relative mt-6 text-[10px] text-gray-600 font-mono">
        © 2026 Node Coverage Analyzer · 세션 인증 게이트웨이 v1.0
      </p>
    </div>
  );
}
