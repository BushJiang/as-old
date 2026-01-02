'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Heart, UserCog, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NavigationWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()
  const { currentUser } = useUserStore()

  // 认证页面和引导页面不显示导航
  const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')
  const showNavigation = !isAuthPage

  return (
    <>
      {/* 顶部导航栏 */}
      {showNavigation && (
        <header className="w-full bg-white border-b sticky top-0 z-10">
          <div className="w-full mx-auto h-16 flex items-center justify-between px-4">
            {/* 左侧：Logo */}
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">如故</h1>
            </div>

            {/* 中间：导航菜单 */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className={`text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                首页
              </button>
              <button
                onClick={() => router.push("/matches/similar-interests")}
                className={`text-sm font-medium transition-colors ${
                  pathname === "/matches/similar-interests"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                兴趣相投
              </button>
              <button
                onClick={() => router.push("/matches/mutual-needs")}
                className={`text-sm font-medium transition-colors ${
                  pathname === "/matches/mutual-needs"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                需求匹配
              </button>
              <button
                onClick={() => router.push("/matches/mutual-provide")}
                className={`text-sm font-medium transition-colors ${
                  pathname === "/matches/mutual-provide"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                互助合作
              </button>
              <button
                onClick={() => router.push("/matches/deep-analysis")}
                className={`text-sm font-medium transition-colors ${
                  pathname === "/matches/deep-analysis"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                探索发现
              </button>
            </nav>

            {/* 右侧：用户信息和操作 */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 border-2 border-blue-200">
                      <AvatarImage
                        src={currentUser?.avatar}
                        alt={currentUser?.name || "用户"}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {currentUser?.name?.[0] || "用"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 hidden sm:block">
                      {currentUser?.name || "用户"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    个人信息
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                    <UserCog className="mr-2 h-4 w-4" />
                    修改资料
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      router.push("/auth/login")
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* 主内容区域 */}
      <div className="pb-16 md:pb-0">
        {children}
      </div>

      {/* 移动端底部导航 */}
      {showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <nav className="flex items-center justify-around h-16 px-2">
            <button
              onClick={() => router.push("/")}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === "/" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">首页</span>
            </button>
            <button
              onClick={() => router.push("/matches/similar-interests")}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.startsWith("/matches/similar-interests") ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">兴趣</span>
            </button>
            <button
              onClick={() => router.push("/matches/mutual-needs")}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.startsWith("/matches/mutual-needs") ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">需求</span>
            </button>
            <button
              onClick={() => router.push("/profile")}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.startsWith("/profile") ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">资料</span>
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
