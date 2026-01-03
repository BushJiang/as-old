"use client";

import { useUserStore } from "@/stores/user-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Edit,
  Heart,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/user/UserCard";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { currentUser, wantToKnowMatches, removeFromWantToKnow } =
    useUserStore();
  const router = useRouter();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* === 左右布局个人卡片 === */}
        <Card className="overflow-hidden border-0 shadow-sm flex flex-col md:flex-row min-h-[320px]">
          {/* --- 左侧：身份信息 (35% 宽度) --- */}
          <div className="w-full md:w-[40%] bg-gray-50/80 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 relative">
            {/* 编辑按钮 */}
            <Button
              variant="outline" // 使用 outline 或 ghost
              size="sm" // 使用 sm 尺寸，适合作为次要按钮
              onClick={() => router.push("/profile/edit")}
              // 样式优化：
              // 1. rounded-full: 胶囊形状，更现代
              // 2. bg-white/50: 半透明背景，更有层次感
              // 3. text-xs: 小字体，不抢视觉重心
              className="absolute top-4 right-4 md:top-4 md:right-4 gap-1.5 rounded-full bg-white/50 hover:bg-white text-gray-600 hover:text-blue-600 border-gray-200/50 hover:border-blue-100 transition-all shadow-sm text-xs font-medium"
            >
              <Edit className="w-3.5 h-3.5" />
              修改资料
            </Button>

            <Avatar className="h-28 w-28 border-4 border-white shadow-sm mb-4">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-bold">
                {currentUser.name[0]}
              </AvatarFallback>
            </Avatar>

            <h3 className="text-2xl font-bold text-gray-900">
              {currentUser.name}
            </h3>

            <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-2">
              <MapPin className="h-3.5 w-3.5" />
              {currentUser.city}
            </div>

            <div className="mt-6 w-full px-2">
              <p className="text-sm text-gray-600 leading-relaxed bg-white/50 p-3 rounded-lg border border-gray-100/50">
                {currentUser.bio || "这个人很懒，什么都没写~"}
              </p>
            </div>
          </div>

          {/* --- 右侧：标签墙 (65% 宽度) --- */}
          {/* 这里是修改重点：单纯的 flex-col 布局，不再使用 grid */}
          <div className="w-full md:w-[60%] p-8 flex flex-col justify-center items-center bg-white">
            <div className="space-y-8">
              {" "}
              {/* 增加垂直间距，让每一行区分明显 */}
              {/* 第 1 行：兴趣 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-yellow-500" /> 兴趣爱好
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-normal"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* 第 2 行：需求 (不再并排) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <ArrowDownCircle className="w-4 h-4 text-blue-500" /> 寻找
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.needs.map((need) => (
                    <Badge
                      key={need}
                      variant="outline"
                      className="px-3 py-1 border-blue-200 text-blue-700 bg-blue-50/30 font-normal"
                    >
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* 第 3 行：提供 (独立一行) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <ArrowUpCircle className="w-4 h-4 text-green-500" /> 提供
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.provide.map((provide) => (
                    <Badge
                      key={provide}
                      variant="outline"
                      className="px-3 py-1 border-green-200 text-green-700 bg-green-50/30 font-normal"
                    >
                      {provide}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* === 下半部分：收藏列表 (保持不变) === */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            收藏 ({wantToKnowMatches.length})
          </h2>

          {wantToKnowMatches.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-200">
              <p>还没有收藏的用户</p>
              <Button
                variant="link"
                onClick={() => router.push("/")}
                className="mt-2"
              >
                去首页看看 &rarr;
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {wantToKnowMatches.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onRemove={() => removeFromWantToKnow(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
