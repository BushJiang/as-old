import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastSeen(lastSeen: string): string {
  if (lastSeen === '刚刚') return '刚刚'
  return lastSeen
}
