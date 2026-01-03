'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar?: string
  userId: string
  userName?: string
  onAvatarChange: (avatarUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUpload({
  currentAvatar,
  userId,
  userName = '用户',
  onAvatarChange,
  size = 'lg'
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 尺寸配置
  const sizeConfig = {
    sm: { container: 'w-16 h-16', button: 'w-6 h-6', icon: 'text-xs' },
    md: { container: 'w-24 h-24', button: 'w-8 h-8', icon: 'text-sm' },
    lg: { container: 'w-32 h-32', button: 'w-10 h-10', icon: 'text-base' }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('请选择 JPG、PNG、WebP 或 GIF 格式的图片')
      return
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setUploading(true)

    try {
      // 创建预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // 上传到本地（开发阶段）
      // 注意：生产环境应该上传到云存储
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()

      // 更新头像 URL
      onAvatarChange(data.avatarUrl)

      // 清除预览，使用新上传的图片
      setPreview(null)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displayAvatar = preview || currentAvatar || '/avatars/default.svg'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 头像容器 */}
      <div className="relative">
        <div
          className={`${sizeConfig[size].container} rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 relative`}
        >
          <Image
            src={displayAvatar}
            alt={userName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />

          {/* 上传中遮罩 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm">上传中...</div>
            </div>
          )}
        </div>

        {/* 上传按钮 */}
        <button
          onClick={handleClick}
          disabled={uploading}
          className={`${sizeConfig[size].button} absolute bottom-0 right-0 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          type="button"
        >
          {uploading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Camera className={sizeConfig[size].icon} />
          )}
        </button>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* 提示文字 */}
      {size === 'lg' && (
        <p className="text-xs text-gray-500">
          支持 JPG、PNG、WebP 格式，最大 5MB
        </p>
      )}
    </div>
  )
}
