"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("邮箱或密码错误");
      }
    } catch (err) {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 纯色背景，居中布局
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      {/* 容器：最大宽度，宽松的内边距 */}
      <div className="w-full max-w-lg">
        {/* 卡片：简洁设计 */}
        <div className="bg-white rounded-2xl p-10">
          {/* 标题区域 */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-black mb-4 tracking-wider leading-relaxed">
              登录
            </h1>
            <p className="text-xl text-gray-600 tracking-wide leading-relaxed">
              欢迎来到如故
            </p>
          </div>
    
          {/* 表单 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* 邮箱输入 */}
            <div>
              <label className="text-2xl font-medium text-black block tracking-wide leading-relaxed">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 bg-white tracking-wide leading-relaxed"
                placeholder="your@email.com"
                required
              />
            </div>
          
            {/* 密码输入 */}
            <div>
              <label className="text-2xl font-medium text-black block tracking-wide leading-relaxed mb-3">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 bg-white tracking-wide leading-relaxed"
                placeholder="••••••••"
                required
              />
            </div>
          
            {/* 错误提示 */}
            {error && (
              <div className="text-lg text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl tracking-wide leading-relaxed">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full h-14 text-2xl bg-blue-700 text-white rounded-full tracking-wide leading-relaxed"
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>

            {/* 注册链接 */}
            <div className="text-center pt-6 mb-20">
              <span className="text-lg text-black tracking-wide leading-relaxed">
                还没有账号？
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/register")}
                className="text-lg text-blue-600 font-semibold ml-2 tracking-wide leading-relaxed "
              >
                立即注册
              </button>
            </div>
          </form>

          {/* 测试账号提示 */}
          <div className="mt-16 p-6 bg-blue-50 border border-blue-200">
            <p className="text-lg font-semibold text-blue-900 mb-3 tracking-wide leading-relaxed">
              测试账号：
            </p>
            <p className="text-lg text-blue-800 tracking-wide leading-relaxed">
              邮箱: test@example.com
            </p>
            <p className="text-lg text-blue-800 tracking-wide leading-relaxed">
              密码: 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
