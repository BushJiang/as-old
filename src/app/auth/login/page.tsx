"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
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
import { Label } from "@/components/ui/label";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

type AuthStep = "login" | "register-email" | "register-code";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { checkEmailExists, login, sendVerificationCode, loginWithCode } = useAuthStore();
  const { reinitializeUser } = useUserStore();

  const [step, setStep] = useState<AuthStep>("login");
  const [mode, setMode] = useState<AuthMode>("signin");

  // 表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 处理登录尝试
  const handleLoginAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 检查邮箱是否存在
      const checkResult = await checkEmailExists(email);

      if (checkResult.error) {
        setError(checkResult.error || "检查邮箱失败");
        setLoading(false);
        return;
      }

      if (!checkResult.exists) {
        // 邮箱不存在，提示用户注册
        setError("该邮箱尚未注册，请先注册");
        setLoading(false);
        return;
      }

      // 邮箱存在，尝试登录
      const loginSuccess = await login(email, password);

      if (loginSuccess) {
        setSuccess("登录成功！");
        setTimeout(() => {
          reinitializeUser();
          router.push("/");
        }, 500);
      } else {
        setError("密码错误");
      }
    } catch (err) {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理注册第一步：发送验证码
  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 检查邮箱是否已存在
      const checkResult = await checkEmailExists(email);

      if (checkResult.error) {
        setError(checkResult.error || "检查邮箱失败");
        setLoading(false);
        return;
      }

      if (checkResult.exists) {
        // 邮箱已存在，提示用户登录
        setError("该邮箱已注册，请直接登录");
        setLoading(false);
        return;
      }

      // 邮箱不存在，发送验证码
      const result = await sendVerificationCode(email);

      if (result.success) {
        setSuccess("验证码已发送");
        setStep("register-code");
      } else {
        setError(result.error || "发送验证码失败");
      }
    } catch (err) {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理注册第二步：验证邮箱
  const handleVerifyCode = async (code: string) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await loginWithCode(email, code);

      if (result.success) {
        setSuccess("邮箱验证成功！");
        setTimeout(() => {
          // 跳转到填写个人信息的页面
          router.push("/onboarding/profile");
        }, 500);
      } else {
        setError(result.error || "验证码错误");
        setLoading(false);
      }
    } catch (err) {
      setError("验证失败，请重试");
      setLoading(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (step === "register-code") {
      setStep("register-email");
      setError("");
      setSuccess("");
      setCode("");
    } else if (step === "register-email") {
      setStep("login");
      setError("");
      setSuccess("");
      setEmail("");
      setPassword("");
    }
  };

  // 切换登录/注册模式
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setStep(newMode === "signup" ? "register-email" : "login");
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setCode("");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>
            {step === "login" && "欢迎来到如故"}
            {step === "register-email" && "注册账号"}
            {step === "register-code" && "验证邮箱"}
          </CardTitle>
          <CardDescription>
            {step === "login" && "输入邮箱和密码登录"}
            {step === "register-email" && "输入邮箱开始注册"}
            {step === "register-code" && `请输入发送到 ${email} 的验证码`}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {/* 登录表单 */}
          {step === "login" && (
            <form id="auth-form" onSubmit={handleLoginAttempt}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 注册 - 输入邮箱 */}
          {step === "register-email" && (
            <form id="auth-form" onSubmit={handleRegisterEmail}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 注册 - 输入验证码 */}
          {step === "register-code" && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  验证码已发送到 <strong>{email}</strong>
                </p>
                <VerificationCodeInput
                  onComplete={handleVerifyCode}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md text-center flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-md flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-600 hover:text-gray-900 text-center"
              >
                ← 返回修改邮箱
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {/* 登录表单按钮 */}
          {step === "login" && (
            <>
              <Button
                form="auth-form"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "登录中..." : "登录"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">还没有账号？ </span>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  立即注册
                </button>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-md text-center">
                <p className="font-semibold mb-1">测试账号：</p>
                <p className="text-gray-600">邮箱：test@example.com</p>
                <p className="text-gray-600">密码：123456</p>
              </div>
            </>
          )}

          {/* 注册 - 输入邮箱按钮 */}
          {step === "register-email" && (
            <>
              <Button
                form="auth-form"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "发送中..." : "发送验证码"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">已有账号？ </span>
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  直接登录
                </button>
              </div>
            </>
          )}

          {/* 注册 - 验证码页面的重新发送 */}
          {step === "register-code" && (
            <p className="text-xs text-center text-gray-500">
              未收到验证码？
              <button
                type="button"
                onClick={handleRegisterEmail}
                className="text-blue-600 hover:underline ml-1"
                disabled={loading}
              >
                重新发送
              </button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
