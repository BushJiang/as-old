'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useFilterStore } from '@/stores/filter-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { INTEREST_CATEGORIES } from '@/lib/types'
import { BottomNavigation } from '@/components/features'

export default function SettingsPage() {
  const { theme, setTheme, useMockMode, setMockMode } = useAppStore()
  const { filters, setAgeRange, setCity, toggleInterest, resetFilters } = useFilterStore()

  const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都', '西安', '南京', '武汉', '重庆']

  return (
    <main className="min-h-screen flex flex-col pb-20">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">设置</h1>

        <Card>
          <CardHeader>
            <CardTitle>应用设置</CardTitle>
            <CardDescription>自定义您的应用体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">主题</label>
              <div className="flex gap-2">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t as any)}
                    className={`px-4 py-2 rounded-lg border ${
                      theme === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">数据模式</label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setMockMode(!useMockMode)}
                  className={`px-4 py-2 rounded-lg border ${
                    useMockMode ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {useMockMode ? '🎭 演示模式' : '🔗 真实模式'}
                </button>
                {useMockMode && (
                  <Badge variant="secondary">无需网络连接</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>筛选条件</CardTitle>
            <CardDescription>设置您希望看到的用户类型</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">年龄范围</label>
              <div className="flex items-center gap-4">
                <span className="text-sm">{filters.ageRange[0]}岁</span>
                <input
                  type="range"
                  min="18"
                  max="50"
                  value={filters.ageRange[0]}
                  onChange={(e) => setAgeRange([parseInt(e.target.value), filters.ageRange[1]])}
                  className="flex-1"
                />
                <span className="text-sm">{filters.ageRange[1]}岁</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">城市</label>
              <select
                value={filters.city || ''}
                onChange={(e) => setCity(e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">不限</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">兴趣爱好</label>
              <div className="space-y-3">
                {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-1 text-gray-700">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            filters.interests.includes(interest)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                重置筛选条件
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>关于</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              如故 v0.1.0 - 寻找一见如故的朋友
            </p>
            <p className="text-sm text-gray-500 mt-2">
              基于 Next.js 15 + React 19 + TypeScript 构建
            </p>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </main>
  )
}
