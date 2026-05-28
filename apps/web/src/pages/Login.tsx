import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Car, ShieldCheck } from "lucide-react";
import { loginSchema, type LoginInput } from "@vms/shared";
import { ApiError, apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

function describeError(err: ApiError): string {
  switch (err.code) {
    case "INVALID_CREDENTIALS":
      return "帳號或密碼錯誤";
    case "ACCOUNT_INACTIVE":
      return "此帳號已停用，請聯絡管理員";
    case "ACCOUNT_LOCKED": {
      const unlock = (err.details as { unlockAt?: string } | undefined)?.unlockAt;
      if (unlock) {
        return `帳號暫時鎖定，請於 ${new Date(unlock).toLocaleTimeString()} 後再試`;
      }
      return "帳號暫時鎖定，請稍後再試";
    }
    default:
      return err.message || "登入失敗";
  }
}

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const { data } = await apiClient.post("/auth/login", values);
      setSession(data.user, data.csrfToken);
      nav("/");
    } catch (err) {
      if (err instanceof ApiError) setServerError(describeError(err));
      else setServerError("登入失敗，請稍後再試");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh animate-aurora" />
      <Card className="relative w-full max-w-md overflow-hidden border-border/60 bg-card/70 shadow-card-lift backdrop-blur-xl">
        <BorderBeam size={260} duration={12} />
        <CardHeader className="space-y-3 pb-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              登入 <AnimatedGradientText>VMS</AnimatedGradientText>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Vehicle Management System・內部車隊管理平台
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">帳號</Label>
              <Input id="username" autoComplete="username" {...register("username")} />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-brand-gradient text-white shadow-glow transition-transform hover:scale-[1.01] hover:opacity-95"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登入中…" : "登入"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              採 JWT + CSRF 雙重保護
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
