"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Quote } from "lucide-react";
import type { User } from "@/lib/types";
import { UserInfoPanel } from "@/components/user/UserInfoPanel";

// --- 类型定义 ---
type MatchType =
  | "similar-interests"
  | "mutual-needs"
  | "mutual-provide"
  | "deep-analysis";

interface SandwichCopy {
  hook: string;
  bridge: string;
  cta: string;
}

// --- 模拟 AI 逻辑 ---
async function generateSandwichCopy(
  matchType: MatchType,
  user: User,
): Promise<SandwichCopy> {
  // 模拟 AI 思考时间
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockDatabase: Record<MatchType, SandwichCopy> = {
    "similar-interests": {
      hook: "技术探索者",
      bridge: `你的【编程】背景与${user.name}对【人工智能】的探索欲简直是天作之合。`,
      cta: "或许你们可以聊聊最新的 AI Agent 架构？",
    },
    "mutual-needs": {
      hook: "成长合伙人",
      bridge: `你正在寻找的【UI设计指导】，${user.name} 刚好拥有丰富的实战经验。`,
      cta: "要不要约个时间请教一下？",
    },
    "mutual-provide": {
      hook: "互补型搭档",
      bridge: `${user.name} 需要你的【后端开发】能力，而TA能帮你搞定【前端动效】。`,
      cta: "也许你们可以一起开启一个小项目？",
    },
    "deep-analysis": {
      hook: "灵魂共鸣",
      bridge: "基于多维分析，你们在阅读品味和生活方式上有着惊人的相似度。",
      cta: "给彼此一个认识的机会吧？",
    },
  };
  return mockDatabase[matchType] || mockDatabase["similar-interests"];
}

interface MatchCardProps {
  user: User;
  matchType?: MatchType;
  onWantToKnow?: (userId: string) => void;
  onNext?: () => void;
  isWantToKnow?: boolean;
}

export function MatchCard({
  user,
  matchType = "similar-interests",
  onWantToKnow,
  onNext,
  isWantToKnow = false,
}: MatchCardProps) {
  const [sandwichCopy, setSandwichCopy] = useState<SandwichCopy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSandwichCopy(null);

    generateSandwichCopy(matchType, user).then((data) => {
      if (isMounted) {
        setSandwichCopy(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user.id, matchType, user]);

  const handleWantToKnow = () => {
    if (onWantToKnow) onWantToKnow(user.id);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto overflow-hidden shadow-lg border-0 flex flex-col md:flex-row min-h-[600px] bg-white transition-all hover:shadow-xl group">
      {/* === 左侧：Hook === */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-50 via-blue-50 to-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto min-h-[300px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-6 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse rounded-full" />
                <Sparkles className="w-12 h-12 text-blue-500 animate-spin-slow relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-700 tracking-tight">
                  AI 正在寻找连接灵感...
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  正在分析共同点与互补性
                </p>
              </div>
            </div>
          ) : sandwichCopy ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3" />
                  AI 匹配洞察
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  <span className="text-slate-400 text-lg block font-normal mb-1">
                    你们都是
                  </span>
                  {sandwichCopy.hook}
                </h2>
              </div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/80 transform transition-transform hover:scale-105 duration-300">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-blue-100 -z-10 fill-current opacity-50" />
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  {sandwichCopy.bridge}
                </p>
              </div>
              <div className="text-slate-500 font-medium text-sm md:text-base">
                💡 破冰建议:{" "}
                <span className="text-blue-600 ml-1 border-b border-blue-200">
                  {sandwichCopy.cta}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        <p className="md:hidden absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400 animate-bounce">
          下滑查看详细资料 ↓
        </p>
      </div>

      {/* === 右侧：Profile === */}
      <div className="w-full md:w-1/2 flex flex-col border-l border-gray-100 bg-white">
        <UserInfoPanel user={user}>
          {/* 底部按钮 */}
          <div className="flex gap-3">
            <Button
              className={`flex-1 text-sm h-10 ${
                isWantToKnow
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={handleWantToKnow}
            >
              <Heart
                className={`w-4 h-4 mr-1.5 ${isWantToKnow ? "fill-current" : ""}`}
              />
              {isWantToKnow ? "已收藏" : "收藏"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-sm h-10 border-gray-200 text-gray-600"
              onClick={onNext}
            >
              下一位
            </Button>
          </div>
        </UserInfoPanel>
      </div>
    </Card>
  );
}
