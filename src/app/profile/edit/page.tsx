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
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";

type SaveStatus = "idle" | "saving" | "success" | "vectorizing";

export default function ProfileEditPage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useUserStore();

  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [vectorizeProgress, setVectorizeProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData) {
      setError("表单数据未加载");
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      setError("请输入有效的年龄（1-100）");
      return;
    }

    setSaveStatus("saving");

    try {
      // 更新本地状态
      await updateProfile({
        ...currentUser,
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
        avatar: formData.avatarUrl,
      });
      setSaveStatus("success");
    } catch (err) {
      setError("保存失败，请重试");
      setSaveStatus("idle");
    }
  };

  // 重新生成匹配向量
  const handleRegenerateMatching = async () => {
    setSaveStatus("vectorizing");
    setVectorizeProgress(0);
    setError("");

    try {
      // 1. 触发向量化
      await embeddingsApi.generate({ embeddingType: 'all' });

      // 2. 轮询状态
      const result = await embeddingsApi.pollStatus(
        (progress) => {
          setVectorizeProgress(progress);
        },
        1000
      );

      if (result.success) {
        // 向量化完成，返回个人资料页
        router.push("/profile");
      } else {
        setError(result.error || "向量化失败，请重试");
        setSaveStatus("idle");
      }
    } catch (err) {
      console.error("向量化错误:", err);
      setError("向量化失败，请重试");
      setSaveStatus("idle");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">正在加载资料...</p>
      </div>
    );
  }

  const isVectorizing = saveStatus === "vectorizing";
  const showSuccess = saveStatus === "success";

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>修改资料</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form id="profile-form" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <ProfileFormFields
                  initialData={currentUser}
                  userId={currentUser.id}
                  onChange={setFormData}
                  error={error}
                />
              </div>

              {/* 向量化进度 */}
              {isVectorizing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      正在重新生成匹配数据...
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vectorizeProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    {vectorizeProgress}% 完成
                  </p>
                </div>
              )}

              {/* 保存成功提示 */}
              {showSuccess && !isVectorizing && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">保存成功</span>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveStatus === "saving" || isVectorizing || !formData}
                >
                  {saveStatus === "saving" ? "保存中..." : "保存"}
                </Button>

                {/* 开始匹配按钮 */}
                {showSuccess && !isVectorizing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleRegenerateMatching}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    开始匹配
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/profile")}
                  disabled={isVectorizing}
                >
                  {showSuccess ? "返回" : "取消"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
