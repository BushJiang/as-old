import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FilterState, FilterStateStore } from '@/lib/types'

const DEFAULT_FILTERS: FilterState = {
  ageRange: [18, 50],  // 扩大年龄范围
  city: null,
  interests: [],       // 不限制兴趣
  personalityTags: [], // 不限制性格
  onlyOnline: false,   // 不限制在线状态
  showMe: 'everyone'
}

export const useFilterStore = create<FilterStateStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setAgeRange: (range) => set((s) => ({ filters: { ...s.filters, ageRange: range } })),
      setCity: (city) => set((s) => ({ filters: { ...s.filters, city } })),
      toggleInterest: (interest) => set((s) => ({
        filters: {
          ...s.filters,
          interests: s.filters.interests.includes(interest)
            ? s.filters.interests.filter(i => i !== interest)
            : [...s.filters.interests, interest]
        }
      })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    { name: 'filter-storage', storage: createJSONStorage(() => localStorage) }
  )
)
