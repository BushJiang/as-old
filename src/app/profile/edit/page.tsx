"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
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

export default function ProfileEditPage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useUserStore();

  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      // 更新本地状态
      updateProfile({
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
      router.push("/profile");
    } catch (err) {
      setError("保存失败，请重试");
    } finally {
      setLoading(false);
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
            <form id="profile-form" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <ProfileFormFields
                  initialData={currentUser}
                  userId={currentUser.id}
                  onChange={setFormData}
                  error={error}
                />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !formData}
                >
                  {loading ? "保存中..." : "保存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/profile")}
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
