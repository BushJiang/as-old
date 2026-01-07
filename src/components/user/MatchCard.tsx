"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@/lib/types";
import { UserInfoPanel } from "@/components/user/UserInfoPanel";
import type { MatchResult } from "@/lib/services/matching-service";
import { generateMatchCopy, type MatchCopyInput } from "@/lib/services/ai-copy-service";
import { useUserStore } from "@/stores/user-store";

// --- 类型定义 ---
type MatchType =
  | "similar-interests"
  | "mutual-needs"
  | "mutual-provide"
  | "exploratory-discovery";

interface SandwichCopy {
  hook: string;
  bridge: string;
  cta: string;
}

interface MatchCardProps {
  user: User;
  matchType?: MatchType;
  onWantToKnow?: (userId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isWantToKnow?: boolean;
  // 新增：匹配详情（包含 matchDetail）
  matchedUser?: MatchResult;
  // 🚀 预加载相关
  preloadedCopy?: any;
  preloadedUserIndex?: number | null;
  currentUserIndex?: number;
}

export function MatchCard({
  user,
  matchType = "similar-interests",
  onWantToKnow,
  onNext,
  onPrevious,
  isWantToKnow = false,
  matchedUser,
  preloadedCopy,
  preloadedUserIndex,
  currentUserIndex,
}: MatchCardProps) {
  const { currentUser } = useUserStore()
  const [sandwichCopy, setSandwichCopy] = useState<SandwichCopy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 只有当有匹配数据时才生成文案
    if (!matchedUser?.matchDetail) {
      setIsLoading(false);
      return;
    }

    // 🚀 检查是否有预加载数据可用
    const hasPreloadedData = preloadedCopy && preloadedUserIndex === currentUserIndex;

    if (hasPreloadedData) {
      console.log('='.repeat(80));
      console.log('🚀 使用预加载数据，无需等待 AI！');
      console.log('='.repeat(80));
      console.log('[预加载] currentUserIndex:', currentUserIndex);
      console.log('[预加载] preloadedUserIndex:', preloadedUserIndex);
      console.log('[预加载] 预加载的文案:', preloadedCopy);
      console.log('='.repeat(80));

      // 直接使用预加载数据，立即显示
      if (isMounted) {
        setSandwichCopy(preloadedCopy);
        setIsLoading(false);
      }
      return;
    }

    console.log('='.repeat(80));
    console.log('❌ 无预加载数据，需要调用 AI 生成');
    console.log('='.repeat(80));
    console.log('[AI生成] currentUserIndex:', currentUserIndex);
    console.log('[AI生成] preloadedUserIndex:', preloadedUserIndex);

    setIsLoading(true);
    setSandwichCopy(null);

    // 准备 AI 输入数据
    const matchDetail = matchedUser.matchDetail;

    // 根据匹配类型选择不同的数据源
    let highlightTagA = "";
    let highlightTagB = "";
    let contextTagsA: string[] = [];
    let contextTagsB: string[] = [];

    switch (matchType) {
      case "similar-interests":
        highlightTagA = matchDetail.myInterest;
        highlightTagB = matchDetail.theirInterest;
        contextTagsA = currentUser?.interests || [];
        contextTagsB = user.interests || [];
        break;

      case "mutual-needs":
        highlightTagA = matchDetail.myInterest;
        highlightTagB = matchDetail.theirInterest;
        contextTagsA = currentUser?.needs || [];
        contextTagsB = user.provide || [];
        break;

      case "mutual-provide":
        highlightTagA = matchDetail.myInterest;
        highlightTagB = matchDetail.theirInterest;
        contextTagsA = currentUser?.provide || [];
        contextTagsB = user.needs || [];
        break;

      case "exploratory-discovery":
        highlightTagA = matchDetail.myInterest;
        highlightTagB = matchDetail.theirInterest;
        contextTagsA = currentUser?.interests || [];
        contextTagsB = user.interests || [];
        break;
    }

    // 准备 AI 输入数据（新格式）
    const aiInput: MatchCopyInput = {
      matchType: matchType,
      myName: currentUser?.name,
      theirName: user.name,
      highlightTagA,
      highlightTagB,
      contextTagsA: contextTagsA.slice(0, 5),
      contextTagsB: contextTagsB.slice(0, 5),
      myBio: currentUser?.bio,
      theirBio: user.bio,
      myCity: currentUser?.city,
      theirCity: user.city,
    };

    console.log('='.repeat(80));
    console.log('🤖 准备调用 AI 生成三明治文案');
    console.log('='.repeat(80));
    console.log('3. 发送给 AI 的完整输入数据（新格式）：');
    console.log(JSON.stringify(aiInput, null, 2));
    console.log('');
    console.log('4. 匹配详情：');
    console.log('   - highlightTagA:', aiInput.highlightTagA);
    console.log('   - highlightTagB:', aiInput.highlightTagB);
    console.log('   - contextTagsA:', aiInput.contextTagsA);
    console.log('   - contextTagsB:', aiInput.contextTagsB);
    console.log('='.repeat(80));

    // 调用 AI 生成文案
    generateMatchCopy(aiInput).then((data) => {
      if (isMounted) {
        console.log('='.repeat(80));
        console.log('✅ AI 生成完成，返回的三明治文案：');
        console.log('='.repeat(80));
        console.log('7. AI 返回的完整数据：');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        console.log('8. 文案解析：');
        console.log('   - hook:', data.hook);
        console.log('   - bridge:', data.bridge);
        console.log('   - cta:', data.cta);
        console.log('   - bridge 中包含的匹配度（需要人工检查）');
        console.log('='.repeat(80));
        setSandwichCopy(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user.id, matchedUser?.matchDetail, user.name, user.interests, currentUser, preloadedCopy, preloadedUserIndex, currentUserIndex]);

  // 添加日志：左侧卡片显示的匹配度
  useEffect(() => {
    if (sandwichCopy && matchedUser?.matchDetail) {
      console.log('='.repeat(80));
      console.log('🎨 左侧卡片即将渲染，显示的匹配度信息：');
      console.log('='.repeat(80));
      console.log('5. 左侧卡片显示的匹配度来源：');
      console.log('   - 变量名: matchedUser.matchDetail.similarityPercent');
      console.log('   - 原始值:', matchedUser.matchDetail.similarityPercent);
      console.log('   - 显示值:', matchedUser.matchDetail.similarityPercent.toFixed(0) + '%');
      console.log('='.repeat(80));
    }
  }, [sandwichCopy, matchedUser?.matchDetail]);

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
          ) : sandwichCopy && matchedUser?.matchDetail ? (
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
                {/* 匹配度显示 */}
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200">
                  <span className="text-sm font-medium text-slate-600">匹配度</span>
                  <span className={`text-lg font-bold ${
                    matchedUser.matchDetail.similarityPercent >= 70 ? 'text-green-600' :
                    matchedUser.matchDetail.similarityPercent >= 30 ? 'text-blue-600' :
                    matchedUser.matchDetail.similarityPercent >= 0 ? 'text-gray-600' :
                    'text-orange-500'
                  }`}>
                    {matchedUser.matchDetail.similarityPercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 第二段：连接语句 */}
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/80 transform transition-transform hover:scale-105 duration-300">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-blue-100 -z-10 fill-current opacity-50" />
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  {sandwichCopy.bridge}
                </p>
              </div>

              {/* 第三段：破冰建议 */}
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
              variant="outline"
              className="flex-1 text-sm h-10 border-gray-200 text-gray-600"
              onClick={onPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-sm h-10 border-gray-200 text-gray-600"
              onClick={onNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              className={`flex-1 text-sm h-10 ${
                isWantToKnow
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={handleWantToKnow}
            >
              <Heart
                className={`w-4 h-4 ${isWantToKnow ? "fill-current" : ""}`}
              />
              {isWantToKnow ? "已收藏" : "收藏"}
            </Button>
          </div>
        </UserInfoPanel>
      </div>
    </Card>
  );
}
