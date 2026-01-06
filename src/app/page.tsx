"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Card } from "@/components/ui/card";
import { MatchCard } from "@/components/user/MatchCard";
import type { User } from "@/lib/types";
import type { MatchResult } from "@/lib/services/matching-service";
// 👇 这里引入图标，如果你想换图标，可以在 lucid.dev 找新图标名字并在这里引入
import { Heart, Target, Handshake, Compass, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchType =
  | "similar-interests"
  | "mutual-needs"
  | "mutual-provide"
  | "exploratory-discovery";

// 匹配结果缓存
interface MatchCache {
  users: User[];
  details: MatchResult[];
  timestamp: number;
}

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
  const { currentUser, potentialMatches, potentialMatchesWithDetails, toggleWantToKnow, isWantToKnow, fetchRecommendations, setMatchesFromCache } =
    useUserStore();

  // --- 状态管理区域 ---
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMatchType, setSelectedMatchType] =
    useState<MatchType | undefined>(undefined); // 当前选中的模式，初始为 undefined
  const [matchedUser, setMatchedUser] = useState<User | null>(null); // 当前展示的那个用户
  const [matchedUserDetail, setMatchedUserDetail] = useState<any>(null); // 当前展示的匹配详情
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null); // 当前选中的按钮索引，初始为 null
  const [userIndex, setUserIndex] = useState(0); // 当前浏览到第几个人
  const [cardKey, setCardKey] = useState(0); // 用于强制刷新卡片动画的 key
  const [isLoading, setIsLoading] = useState(false); // 是否正在加载匹配数据
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在重新匹配
  const [forceRefresh, setForceRefresh] = useState(false); // 是否强制刷新（忽略缓存）
  const [isClearing, setIsClearing] = useState(false); // 是否正在清除数据
  const [isSwitchingMode, setIsSwitchingMode] = useState(false); // 是否正在切换模式

  // 🚀 预加载状态
  const [preloadedCopy, setPreloadedCopy] = useState<any>(null); // 预加载的三明治文案
  const [preloadedUserIndex, setPreloadedUserIndex] = useState<number | null>(null); // 预加载文案对应的用户索引

  // 匹配结果缓存（每种模式保存一次）
  const [matchCache, setMatchCache] = useState<Record<MatchType, MatchCache | null>>({
    "similar-interests": null,
    "mutual-needs": null,
    "mutual-provide": null,
    "exploratory-discovery": null,
  });

  // 使用 ref 来跟踪当前模式的数据版本，避免模式切换时的混乱
  const dataVersionRef = useRef<string>("");

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
      const cached = matchCache[selectedMatchType];

      console.log('[匹配加载] 触发，模式:', selectedMatchType, '有缓存:', !!cached, '强制刷新:', forceRefresh);

      // 如果强制刷新，忽略缓存，重新调用 API 进行向量匹配
      if (cached && !forceRefresh) {
        console.log('[匹配加载] 使用缓存数据，模式:', selectedMatchType);
        // 从缓存恢复数据
        setMatchesFromCache(selectedMatchType, cached.users, cached.details);
        // 更新数据版本，标记数据已准备好
        dataVersionRef.current = `${selectedMatchType}_ready`;
        setIsLoading(false);
        setIsRefreshing(false);
        setIsSwitchingMode(false); // 重置切换模式标志
      } else {
        // 无缓存或强制刷新，调用 API 进行向量余弦匹配计算
        console.log(forceRefresh ? '[匹配加载] 强制刷新，开始向量匹配计算' : '[匹配加载] 无缓存，开始向量匹配计算，模式:', selectedMatchType);
        setIsLoading(true);
        // 更新数据版本，标记新的模式正在加载数据
        dataVersionRef.current = `${selectedMatchType}_loading`;
        fetchRecommendations({ mode: selectedMatchType, limit: 20 })
          .finally(() => {
            // 数据加载完成，更新版本
            dataVersionRef.current = `${selectedMatchType}_ready`;
            console.log('[匹配加载] 向量匹配计算完成，设置版本为:', dataVersionRef.current);
            setIsLoading(false);
            setIsRefreshing(false);
            setForceRefresh(false); // 重置强制刷新标志
            setIsSwitchingMode(false); // 重置切换模式标志
          });
      }
    }
  }, [selectedMatchType, isAuthenticated, currentUser, fetchRecommendations, matchCache, setMatchesFromCache, forceRefresh]);

  // 监听数据变化，保存到缓存（只在 API 返回新数据时）
  useEffect(() => {
    // 只在数据从空变为有数据时保存
    // 并且当前没有正在使用缓存（即 matchCache[selectedMatchType] 为空）
    if (
      selectedMatchType &&
      potentialMatches.length > 0 &&
      potentialMatchesWithDetails.length > 0 &&
      !matchCache[selectedMatchType] &&
      !isLoading
    ) {
      console.log('[匹配缓存] 保存到缓存，模式:', selectedMatchType, '用户数:', potentialMatches.length);
      console.log('[匹配缓存] potentialMatchesWithDetails[0]:', potentialMatchesWithDetails[0]);
      setMatchCache(prev => ({
        ...prev,
        [selectedMatchType]: {
          users: potentialMatches,
          details: potentialMatchesWithDetails,
          timestamp: Date.now(),
        },
      }));
    }
  }, [potentialMatches, potentialMatchesWithDetails, selectedMatchType, isLoading, matchCache]);

  // 🤖 核心逻辑：根据选中的模式，计算该显示哪个用户
  // 如果你想修改匹配算法，主要看这里
  useEffect(() => {
    console.log('[展示逻辑 useEffect] 触发');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - currentUser:', !!currentUser);
    console.log('  - selectedMatchType:', selectedMatchType);
    console.log('  - isLoading:', isLoading);
    console.log('  - isClearing:', isClearing);
    console.log('  - dataVersionRef.current:', dataVersionRef.current);
    console.log('  - potentialMatches.length:', potentialMatches.length);
    console.log('  - potentialMatchesWithDetails.length:', potentialMatchesWithDetails.length);

    // 跳过条件
    if (!isAuthenticated || !currentUser || !selectedMatchType || isLoading) {
      console.log('[展示逻辑] 跳过（不满足前置条件）');
      return;
    }

    // 如果正在清除数据，跳过展示逻辑
    if (isClearing) {
      console.log('[展示逻辑] 跳过（正在清除数据）');
      return;
    }

    // 如果正在切换模式，跳过展示逻辑（防止显示旧数据）
    if (isSwitchingMode) {
      console.log('[展示逻辑] 跳过（正在切换模式）');
      return;
    }

    // 关键检查：只处理当前选中模式的数据
    const expectedVersion = `${selectedMatchType}_ready`;
    if (dataVersionRef.current !== expectedVersion) {
      console.log('[展示逻辑] 跳过（版本不匹配）, 期望:', expectedVersion, '实际:', dataVersionRef.current);
      return;
    }

    // 只在数据准备好时计算显示用户
    if (potentialMatches.length > 0 && potentialMatchesWithDetails.length > 0) {
      console.log('[展示逻辑] 计算显示用户，userIndex:', userIndex);

      // 后端已经根据匹配类型排序了，最匹配的用户在索引0
      // 直接使用 userIndex 来浏览所有匹配结果
      const actualIndex = userIndex % potentialMatches.length;
      const user = potentialMatches[actualIndex] || potentialMatches[0];
      const userDetail = potentialMatchesWithDetails[actualIndex] || potentialMatchesWithDetails[0];

      console.log('[展示逻辑] 用户:', user?.name, 'matchDetail:', userDetail?.matchDetail);
      console.log('[展示逻辑] actualIndex:', actualIndex, 'matchDetail.similarityPercent:', userDetail?.matchDetail?.similarityPercent);

      // 🔥 关键修复：检查 matchDetail 是否存在，只有存在时才更新显示
      if (user && userDetail?.matchDetail) {
        console.log('[展示逻辑] ✅ 数据完整，更新显示');
        console.log('='.repeat(80));
        console.log('📊 完整的匹配数据信息：');
        console.log('='.repeat(80));
        console.log('1. 用户基本信息：');
        console.log('   - 用户ID:', user.id);
        console.log('   - 用户名:', user.name);
        console.log('   - 兴趣:', user.interests);
        console.log('   - 需求:', user.needs);
        console.log('   - 提供:', user.provide);
        console.log('');
        console.log('2. 匹配详情（matchDetail）：');
        console.log('   - myInterest:', userDetail.matchDetail.myInterest);
        console.log('   - theirInterest:', userDetail.matchDetail.theirInterest);
        console.log('   - similarityPercent:', userDetail.matchDetail.similarityPercent);
        console.log('   - similarityPercent (保留2位小数):', userDetail.matchDetail.similarityPercent.toFixed(2));
        console.log('   - similarityPercent (整数):', userDetail.matchDetail.similarityPercent.toFixed(0));
        console.log('='.repeat(80));
        setMatchedUser(user);
        setMatchedUserDetail(userDetail);
      } else {
        console.log('[展示逻辑] ❌ 数据不完整，等待完整数据');
        console.log('   user:', !!user, 'userDetail:', !!userDetail, 'matchDetail:', !!userDetail?.matchDetail);
      }
    } else {
      console.log('[展示逻辑] 跳过（没有数据）');
    }
  }, [
    userIndex,
    selectedMatchType,
    isAuthenticated,
    currentUser,
    isLoading,
    isClearing,
    isSwitchingMode,
    potentialMatches,
    potentialMatchesWithDetails,
  ]); // 恢复必要的依赖项

  // 🚀 预加载逻辑：当展示当前用户时，预加载下一个用户的三明治文案
  useEffect(() => {
    // 跳过条件
    if (!isAuthenticated || !currentUser || !selectedMatchType || isLoading) {
      return;
    }

    // 如果正在清除数据，跳过
    if (isClearing) {
      return;
    }

    // 只在数据准备好时预加载
    if (potentialMatches.length > 0 && potentialMatchesWithDetails.length > 0 && matchedUser && matchedUserDetail) {
      // 计算下一个用户的索引
      const nextIndex = (userIndex + 1) % potentialMatches.length;

      // 如果预加载的索引和当前索引不一致，说明需要预加载
      if (preloadedUserIndex !== nextIndex) {
        const nextUser = potentialMatches[nextIndex];
        const nextUserDetail = potentialMatchesWithDetails[nextIndex];

        // 确保下一个用户的数据完整
        if (nextUser && nextUserDetail?.matchDetail) {
          console.log('='.repeat(80));
          console.log('🚀 开始预加载下一个用户的三明治文案');
          console.log('='.repeat(80));
          console.log('[预加载] 当前用户索引:', userIndex, '→ 预加载用户索引:', nextIndex);
          console.log('[预加载] 下一个用户:', nextUser.name);
          console.log('[预加载] 匹配详情:', nextUserDetail.matchDetail);

          // 准备 AI 输入数据
          const matchDetail = nextUserDetail.matchDetail;
          let highlightTagA = "";
          let highlightTagB = "";
          let contextTagsA: string[] = [];
          let contextTagsB: string[] = [];

          switch (selectedMatchType) {
            case "similar-interests":
              highlightTagA = matchDetail.myInterest;
              highlightTagB = matchDetail.theirInterest;
              contextTagsA = currentUser?.interests || [];
              contextTagsB = nextUser.interests || [];
              break;

            case "mutual-needs":
              highlightTagA = matchDetail.myInterest;
              highlightTagB = matchDetail.theirInterest;
              contextTagsA = currentUser?.needs || [];
              contextTagsB = nextUser.provide || [];
              break;

            case "mutual-provide":
              highlightTagA = matchDetail.myInterest;
              highlightTagB = matchDetail.theirInterest;
              contextTagsA = currentUser?.provide || [];
              contextTagsB = nextUser.needs || [];
              break;

            case "exploratory-discovery":
              highlightTagA = matchDetail.myInterest;
              highlightTagB = matchDetail.theirInterest;
              contextTagsA = currentUser?.interests || [];
              contextTagsB = nextUser.interests || [];
              break;
          }

          // 准备 AI 输入
          const aiInput = {
            matchType: selectedMatchType,
            myName: currentUser?.name,
            theirName: nextUser.name,
            highlightTagA,
            highlightTagB,
            contextTagsA: contextTagsA.slice(0, 5),
            contextTagsB: contextTagsB.slice(0, 5),
            myBio: currentUser?.bio,
            theirBio: nextUser.bio,
            myCity: currentUser?.city,
            theirCity: nextUser.city,
          };

          // 异步调用 AI 生成文案（不阻塞当前流程）
          import('@/lib/services/ai-copy-service').then(({ generateMatchCopy }) => {
            generateMatchCopy(aiInput)
              .then((data) => {
                console.log('[预加载] ✅ 预加载完成，用户索引:', nextIndex);
                console.log('[预加载] 文案:', data);
                setPreloadedCopy(data);
                setPreloadedUserIndex(nextIndex);
              })
              .catch((error) => {
                console.error('[预加载] ❌ 预加载失败:', error);
              });
          });

          console.log('='.repeat(80));
        }
      }
    }
  }, [
    userIndex,
    selectedMatchType,
    isAuthenticated,
    currentUser,
    isLoading,
    isClearing,
    potentialMatches,
    potentialMatchesWithDetails,
    matchedUser,
    matchedUserDetail,
    preloadedUserIndex,
  ]);

  // 点击上方 4 个功能按钮时触发
  const handleFeatureClick = (index: number, type: MatchType) => {
    console.log('[切换模式] 从', selectedMatchType, '到', type);

    // 设置切换模式标志，阻止显示旧数据
    setIsSwitchingMode(true);

    // 先清空显示，避免显示错误数据
    setMatchedUser(null);
    setMatchedUserDetail(null);

    // 然后更新模式
    setSelectedFeature(index);
    setSelectedMatchType(type);
    setUserIndex(0);
    setCardKey((prev) => prev + 1);
  };

  // 点击“收藏”按钮
  const handleWantToKnow = (userId: string) => {
    toggleWantToKnow(userId);
  };

  // 点击"下一位"按钮
  const handleNext = () => {
    setUserIndex((prev) => prev + 1);
    setCardKey((prev) => prev + 1);
  };

  // 点击"清除数据"按钮
  const handleRefreshMatch = () => {
    if (!selectedMatchType || isRefreshing) return;

    console.log('[清除数据] 开始清除操作，模式:', selectedMatchType);

    // 设置清除状态
    setIsClearing(true);

    // 清除当前模式的缓存
    setMatchCache(prev => ({
      ...prev,
      [selectedMatchType]: null,
    }));
    console.log('[清除数据] ✓ 已清除缓存');

    // 清除 store 中的匹配数据（不调用 API）
    setMatchesFromCache(selectedMatchType, [], []);
    console.log('[清除数据] ✓ 已清除 store 中的匹配数据');

    // 清除选中状态（恢复按钮颜色）
    setSelectedFeature(null);
    // 清除匹配类型，这样点击匹配按钮时一定会触发数据加载
    const previousMatchType = selectedMatchType;
    setSelectedMatchType(undefined);
    console.log('[清除数据] ✓ 已清除选中状态，匹配类型从', previousMatchType, '重置为 undefined');

    // 清空当前显示的用户
    setMatchedUser(null);
    setMatchedUserDetail(null);
    console.log('[清除数据] ✓ 已清空显示的用户');

    // 重置索引
    setUserIndex(0);
    setCardKey(prev => prev + 1);

    // 重置数据版本
    dataVersionRef.current = '';

    // 设置刷新标志，下次点击匹配按钮时强制重新计算
    setForceRefresh(true);

    console.log('[清除数据] 已清空，请点击匹配按钮重新开始');

    // 短暂延迟后重置清除状态，确保 UI 更新完成
    setTimeout(() => {
      setIsClearing(false);
      console.log('[清除数据] 清除状态已重置');
    }, 100);
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
          {/* 👇 grid-cols-2 代表手机一行2个，md:grid-cols-5 代表电脑一行5个（4个匹配按钮 + 1个刷新按钮） */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
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

            {/* 清除数据按钮 */}
            <Card
              onClick={selectedMatchType ? handleRefreshMatch : undefined}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out border-2",
                "hover:shadow-lg hover:-translate-y-1",
                "bg-white border-transparent hover:border-gray-100 shadow-sm text-gray-600",
                // 没有选中模式时，显示半透明状态，并禁用点击
                !selectedMatchType && "opacity-50 cursor-not-allowed",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="p-1 flex flex-col items-center justify-center text-center space-y-1">
                <div className="p-1 rounded-full transition-colors duration-300 bg-gray-100 text-gray-400">
                  <Loader2 className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm md:text-base text-gray-700 transition-colors">
                    清除数据
                  </h3>
                  <p className="text-xs leading-tight text-gray-400 transition-colors">
                    清空匹配结果
                  </p>
                </div>
              </div>
            </Card>
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
                preloadedCopy={preloadedCopy}
                preloadedUserIndex={preloadedUserIndex}
                currentUserIndex={userIndex}
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
              {isClearing ? (
                <>
                  <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-40" />
                  <p className="text-center">正在清除匹配数据...</p>
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-40" />
                  <p className="text-center">找呀找呀找朋友...</p>
                </>
              ) : !selectedMatchType ? (
                <>
                  <Compass className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center">请点击上方的匹配方式按钮<br/>开始发现你的完美连接</p>
                </>
              ) : (
                <>
                  <Compass className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center">数据已清除，请点击匹配按钮重新开始</p>
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
