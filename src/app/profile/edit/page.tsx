"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
import { embeddingsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ProfileFormFields,
  type ProfileFormData,
} from "@/components/user/ProfileFormFields";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useUserStore();

  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 提交表单并自动向量化
  const handleSubmitAndVectorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    setIsSaved(false);

    if (!formData) {
      setError("表单数据未加载");
      setIsSaving(false);
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      setError("请输入有效的年龄（1-100）");
      setIsSaving(false);
      return;
    }

    try {
      // 1. 更新本地状态（只传递需要更新的字段）
      const updateData: Partial<User> = {
        name: formData.name,
        age: ageNum,
        city: formData.city,
        bio: formData.bio,
        interests: formData.interestsText
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n),
        needs: formData.needsText
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n),
        provide: formData.provideText
          .split("\n")
          .map((p) => p.trim())
          .filter((p) => p),
      }

      // 只在头像发生变化时才更新
      if (formData.avatarUrl && formData.avatarUrl !== currentUser?.avatar) {
        updateData.avatar = formData.avatarUrl
      }

      console.log("开始更新资料...");
      const success = await updateProfile(updateData);
      console.log("资料更新结果:", success);

      // 检查更新是否成功
      if (!success) {
        setError("保存失败，请重试");
        setIsSaving(false);
        return;
      }

      // 2. 后台自动向量化（不阻塞 UI）
      console.log("开始后台向量化...");
      embeddingsApi.generate({ embeddingType: 'all' })
        .then(result => {
          console.log("向量化完成:", result);
        })
        .catch(err => {
          console.error("向量化失败:", err);
        });

      // 3. 立即返回，不等待向量化完成
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (err) {
      console.error("操作错误:", err);
      setError("保存失败，请重试");
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">正在加载资料...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>修改资料</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form id="profile-form" onSubmit={handleSubmitAndVectorize}>
              <div className="flex flex-col gap-4">
                <ProfileFormFields
                  initialData={currentUser}
                  userId={currentUser.id}
                  onChange={setFormData}
                  error={error}
                />
              </div>

              {/* 保存状态提示 */}
              {isSaving && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在保存...</span>
                </div>
              )}

              {/* 保存成功提示 */}
              {isSaved && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">保存成功，正在跳转...</span>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || !formData}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/profile")}
                  disabled={isSaving}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
