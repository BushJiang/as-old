"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Users, Gift, Brain, LogOut, UserCog } from "lucide-react";

const FEATURES = [
  {
    icon: Heart,
    title: "兴趣相投",
    desc: "寻找兴趣爱好相似的朋友",
    type: "similar_interests",
    color: "bg-pink-500",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "需求匹配",
    desc: "找到能提供你需要帮助的人",
    type: "mutual_needs",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Gift,
    title: "互助合作",
    desc: "发现你可以帮助的人",
    type: "mutual_provide",
    color: "bg-green-500",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Brain,
    title: "深度分析",
    desc: "探索潜在的朋友可能性",
    type: "deep_analysis",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-violet-500",
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const { currentUser } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* L1: Viewport (视口层) - 整个应用的根容器，定义最大显示范围 */}
      {/* L2: Layout (布局层) - 页面结构组件，定义区域划分和排列方式 */}
      <header className="w-full bg-white border-b sticky top-0 z-10">
        <div className="w-full mx-auto h-28 flex items-center justify-between">
          <div></div> {/* 占空位 */}
          <h1 className="text-2xl font-bold text-center">如故</h1>
          <div className="flex items-center gap-4 mr-16">
            {/* shadcn Avatar 组件 - 基础用法 */}
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage
                  src={currentUser?.avatar}
                  alt={currentUser?.name || "用户"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {currentUser?.name?.[0] || "用"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {currentUser?.name || "用户"}
              </span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/profile/edit")}
              className="h-8 px-3"
            >
              <UserCog className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">修改资料</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              title="退出登录"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="h-4"></div>

      {/* L2: Layout (布局层) - 主内容区域，定义内容容器和对齐方式 */}
      <div className="mx-auto flex-1 flex flex-col items-center p-6 pt-4 w-full">
        <div className="w-full flex flex-col items-center space-y-8">
          {/* 欢迎语部分 */}
          {/* L3: Content (内容层) - 欢迎语，展示用户名字和 slogan */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-2xl font-bold text-foreground leading-relaxed">
              欢迎，{currentUser?.name || "用户"}！
            </h2>
            {/* L3: Content (内容层) - 应用的核心数据和业务逻辑展示 */}
            <p className="text-md text-muted-foreground leading-loose">
              找到真正一见如故的朋友
            </p>
          </div>

          <div className="h-4"></div>

          {/* L3: Content (内容层) - 功能卡片网格，使用 CSS Grid 布局，2列网格，列间距为 64px */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-2xl">
            {FEATURES.map((item) => (
              <Card
                key={item.type}
                onClick={() => router.push(`/matches/${item.type}`)}
                className="cursor-pointer transition-all duration-200 bg-sky-200 hover:shadow-lg hover:-translate-y-1 group min-h-20"
              >
                {/* 卡片头部 - 水平布局，左侧图标，右侧标题 */}
                <CardHeader className="flex flex-row items-center gap-12 pb-3 h-full">
                  {/* 左侧图标容器 - 固定尺寸，渐变背景，悬停时图标放大 */}
                  <div
                    className={`${item.color} shrink-0 w-16 h-16 flex items-center justify-center rounded-3xl text-white shadow-lg group-hover:scale-110 transition-transform ${item.gradient}`}
                  >
                    {/* 功能图标 */}
                    <item.icon className="w-12 h-12" />
                  </div>

                  {/* 右侧标题区域 - 占据剩余空间，垂直居中 */}
                  <div className="flex-1 flex flex-col">
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                {/* 卡片内容 - 描述文字，文字居中 */}
                <CardContent className="pt-0">
                  <CardDescription className="text-md text-muted-foreground text-center">
                    {item.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* L2: Layout (布局层) - Footer 底部区域，定义页面底部容器 */}
      <div className="max-w-5xl mx-auto w-full">
        <footer className="text-center py-6 text-xs text-muted-foreground border-t">
          {/* L3: Content (内容层) - Footer 版权信息 */}© 2025 Rugulab
        </footer>
      </div>
    </div>
  );
}
