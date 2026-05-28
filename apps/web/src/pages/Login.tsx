import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@vms/shared";
import { ApiError, apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登入 VMS</CardTitle>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              登入
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
