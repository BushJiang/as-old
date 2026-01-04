"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Card } from "@/components/ui/card";
import { MatchCard } from "@/components/user/MatchCard";
import type { User } from "@/lib/types";
// 👇 这里引入图标，如果你想换图标，可以在 lucid.dev 找新图标名字并在这里引入
import { Heart, Target, Handshake, Compass, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchType =
  | "similar-interests"
  | "mutual-needs"
  | "mutual-provide"
  | "exploratory-discovery";

// =========================================================================
// ✨✨ 配置区域：这里定义那 4 个功能按钮的样式、文字和颜色 ✨✨
// =========================================================================
// 如果你想修改：
// 1. 按钮显示的文字 -> 修改 title 和 desc
// 2. 按钮的颜色 -> 修改 activeColor (文字色), activeBg (背景色), activeBorder (边框色)
// 3. 图标 -> 修改 icon
const FEATURES = [
  {
    title: "兴趣相投",
    desc: "寻找灵魂共鸣",
    type: "similar-interests" as MatchType,
    icon: Heart, // 图标组件
    // 👇 下面是 Tailwind 颜色类名，可以换成 blue, green, violet, orange 等
    activeColor: "text-rose-500", // 选中时：文字颜色
    activeBg: "bg-rose-50", // 选中时：背景颜色
    activeBorder: "border-rose-200", // 选中时：边框颜色
    iconBg: "bg-rose-100", // 图标背景圈颜色
  },
  {
    title: "需求匹配",
    desc: "寻找你的贵人",
    type: "mutual-needs" as MatchType,
    icon: Target,
    activeColor: "text-blue-500",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    title: "助人为乐",
    desc: "发挥你的价值",
    type: "mutual-provide" as MatchType,
    icon: Handshake,
    activeColor: "text-emerald-500",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  {
    title: "探索发现",
    desc: "无限可能",
    type: "exploratory-discovery" as MatchType,
    icon: Compass,
    activeColor: "text-violet-500",
    activeBg: "bg-violet-50",
    activeBorder: "border-violet-200",
    iconBg: "bg-violet-100",
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { currentUser, potentialMatches, potentialMatchesWithDetails, toggleWantToKnow, isWantToKnow, fetchRecommendations } =
    useUserStore();

  // --- 状态管理区域 ---
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMatchType, setSelectedMatchType] =
    useState<MatchType | null>(null); // 当前选中的模式，初始为 null
  const [matchedUser, setMatchedUser] = useState<User | null>(null); // 当前展示的那个用户
  const [matchedUserDetail, setMatchedUserDetail] = useState<any>(null); // 当前展示的匹配详情
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null); // 当前选中的按钮索引，初始为 null
  const [userIndex, setUserIndex] = useState(0); // 当前浏览到第几个人
  const [cardKey, setCardKey] = useState(0); // 用于强制刷新卡片动画的 key
  const [isLoading, setIsLoading] = useState(false); // 是否正在加载匹配数据

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 没登录就跳去登录页
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isMounted, isAuthenticated, router]);

  // 从 API 获取匹配数据（只在选择了匹配模式后）
  useEffect(() => {
    if (isAuthenticated && currentUser && selectedMatchType) {
      setIsLoading(true);
      fetchRecommendations({ mode: selectedMatchType, limit: 20 })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedMatchType, isAuthenticated, currentUser, fetchRecommendations]);

  // 🤖 核心逻辑：根据选中的模式，计算该显示哪个用户
  // 如果你想修改匹配算法，主要看这里
  useEffect(() => {
    // 只在数据加载完成后才计算显示的用户
    if (isAuthenticated && currentUser && potentialMatches.length > 0 && selectedMatchType && !isLoading) {
      const indexMap: Record<MatchType, number> = {
        "similar-interests": 0,
        "mutual-needs": 1,
        "mutual-provide": 2,
        "exploratory-discovery": 3,
      };
      // 这里的逻辑是简单的取模循环，实际项目可能需要从 API 获取
      const baseIndex = indexMap[selectedMatchType];
      const actualIndex = (baseIndex + userIndex) % potentialMatches.length;
      const user = potentialMatches[actualIndex] || potentialMatches[0];
      const userDetail = potentialMatchesWithDetails[actualIndex] || potentialMatchesWithDetails[0];
      setMatchedUser(user || null);
      setMatchedUserDetail(userDetail || null);
    }
  }, [
    selectedMatchType,
    userIndex,
    isAuthenticated,
    currentUser,
    potentialMatches,
    potentialMatchesWithDetails,
    isLoading,
  ]);

  // 点击上方 4 个功能按钮时触发
  const handleFeatureClick = (index: number, type: MatchType) => {
    setSelectedFeature(index);
    setSelectedMatchType(type);
    setUserIndex(0); // 重置到第一个人
    setCardKey((prev) => prev + 1); // 触发动画重置
  };

  // 点击“收藏”按钮
  const handleWantToKnow = (userId: string) => {
    toggleWantToKnow(userId);
  };

  // 点击“下一位”按钮
  const handleNext = () => {
    setUserIndex((prev) => prev + 1);
    setCardKey((prev) => prev + 1);
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    // 最外层容器：灰色背景
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      {/* 内容限制宽度容器 (max-w-5xl) */}
      <div className="mx-auto flex-1 flex flex-col w-full max-w-5xl px-4 py-2 space-y-2">
        {/* === 1. 顶部欢迎语区域 === */}
        <div className="text-center space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            你好，{currentUser?.name} 👋
          </h1>
          <p className="text-gray-500">选择一种方式，发现你的完美连接</p>
        </div>

        {/* === 2. 功能入口按钮区 (关键修改区) === */}
        <div className="w-full">
          {/* 👇 grid-cols-2 代表手机一行2个，md:grid-cols-4 代表电脑一行4个 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {FEATURES.map((item, index) => {
              const isSelected = selectedFeature === index;
              const Icon = item.icon;

              return (
                <Card
                  key={item.type}
                  onClick={() => handleFeatureClick(index, item.type)}
                  className={cn(
                    // 基础样式：相对定位、隐藏溢出、鼠标手型、过渡动画、边框
                    "relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out border-2",
                    "hover:shadow-lg hover:-translate-y-1",

                    // 👇 动态样式逻辑：如果被选中 (isSelected)，应用配置里的颜色；否则显示默认白色
                    isSelected
                      ? cn(item.activeBorder, item.activeBg, "shadow-sm")
                      : "bg-white border-transparent hover:border-gray-100 shadow-sm text-gray-600",
                  )}
                >
                  <div className="p-1 flex flex-col items-center justify-center text-center space-y-1">
                    {/* 图标圆圈容器 */}
                    <div
                      className={cn(
                        "p-1 rounded-full transition-colors duration-300",
                        // 选中变色，没选中灰色
                        isSelected
                          ? cn("bg-white", item.activeColor)
                          : "bg-gray-100 text-gray-400 group-hover:text-gray-600",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isSelected && "fill-current opacity-20", // 选中时图标加一点填充感
                        )}
                        strokeWidth={2.5}
                      />
                    </div>

                    {/* 按钮文字部分 */}
                    <div className="space-y-1">
                      <h3
                        className={cn(
                          "font-bold text-sm md:text-base transition-colors",
                          isSelected ? "text-gray-900" : "text-gray-700",
                        )}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={cn(
                          "text-xs leading-tight transition-colors",
                          isSelected
                            ? cn(item.activeColor, "opacity-80")
                            : "text-gray-400",
                        )}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* === 3. 核心卡片展示区 === */}
        <div className="flex-1 flex items-start justify-center min-h-120">
          {matchedUser ? (
            // 这是一个动画容器：淡入 + 缩放
            <div className="w-full animate-in fade-in zoom-in-95 duration-500">
              {/* 👇 这里调用了之前写好的 MatchCard 组件 */}
              <MatchCard
                key={cardKey} // key 变化会强制组件重新渲染，从而触发动画
                user={matchedUser}
                matchType={selectedMatchType}
                matchedUser={matchedUserDetail}
                onWantToKnow={handleWantToKnow}
                onNext={handleNext}
                isWantToKnow={
                  matchedUser ? isWantToKnow(matchedUser.id) : false
                }
              />
            </div>
          ) : (
            // 空状态展示
            <div className="flex flex-col items-center justify-center h-60 text-gray-400">
              {isLoading ? (
                <>
                  <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-40" />
                  <p className="text-center">正在寻找朋友...</p>
                </>
              ) : selectedFeature === null ? (
                <>
                  <Compass className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center">请点击上方的匹配方式按钮<br/>开始发现你的完美连接</p>
                </>
              ) : (
                <>
                  <Compass className="w-12 h-12 mb-4 opacity-20" />
                  <p>暂无匹配用户</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === 4. 底部 Footer === */}
      <div className="w-full border-t bg-white/50 backdrop-blur-sm mt-auto">
        <footer className="max-w-5xl mx-auto py-6 px-6 text-center text-xs text-gray-400">
          © 2025 如故 · Find Meaningful Connections
        </footer>
      </div>
    </div>
  );
}
