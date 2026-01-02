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

export default function LoginPage() {
  const router = useRouter();
  const { login, register, checkUserExists } = useAuthStore();
  const { reinitializeUser } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 先检查用户是否存在
      const userExists = checkUserExists(email);

      if (userExists) {
        // 用户存在，尝试登录
        const loginSuccess = await login(email, password);

        if (loginSuccess) {
          reinitializeUser();
          router.push("/");
        } else {
          setError("密码错误，请重试");
        }
      } else {
        // 用户不存在，自动注册
        const registerSuccess = await register(email, password);

        if (registerSuccess) {
          router.push("/onboarding/profile");
        } else {
          setError("注册失败，请稍后重试");
        }
      }
    } catch (err) {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/50 p-4">
      {/* 样式参考：Card 宽度设置 */}
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>欢迎来到如故</CardTitle>
          <CardDescription>
            输入邮箱和密码登录，新用户将自动创建账号
          </CardDescription>
        </CardHeader>

        {/* 样式参考：添加 p-6 pt-0 确保有左右内边距，且上方不留白 */}
        <CardContent className="p-6 pt-0">
          {/*
             关键修改：给 form 添加 ID，因为提交按钮被移到了 Footer
             使用 flex-col gap-6 保持内部元素间距一致
          */}
          <form id="auth-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* 邮箱输入组：样式参考 grid gap-2 */}
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* 密码输入组：样式参考 grid gap-2 */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                  {/* 这里保留了 flex 布局，方便未来像参考代码一样添加"忘记密码"链接 */}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="6位密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* 错误提示：保持原有逻辑，放入 gap 流中 */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* 测试账号提示：保持原有逻辑，放入 gap 流中 */}
              <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-md text-center">
                <p className="font-semibold mb-1">测试账号：</p>
                <p>邮箱: test@example.com</p>
                <p>密码: 123456</p>
              </div>
            </div>
          </form>
        </CardContent>

        {/* 样式参考：Footer 布局，包含按钮 */}
        <CardFooter className="flex-col gap-2">
          {/*
             关键修改：添加 form="auth-form" 属性
             这允许按钮在 form 标签外部也能提交表单
          */}
          <Button
            form="auth-form"
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "处理中..." : "登录/注册"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
