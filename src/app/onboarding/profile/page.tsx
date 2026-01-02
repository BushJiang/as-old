"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, completeProfile } = useAuthStore();
  const { updateProfile } = useUserStore();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "",
    bio: "",
    interestsText: "",
    needsText: "",
    provideText: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 为每个输入框创建 ref
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLInputElement>(null);
  const interestsRef = useRef<HTMLTextAreaElement>(null);
  const needsRef = useRef<HTMLTextAreaElement>(null);
  const provideRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除错误提示
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 按顺序检查必填项，找到第一个未填写的字段并聚焦
    if (!formData.name) {
      setError("请填写姓名");
      nameRef.current?.focus();
      return;
    }

    if (!formData.age) {
      setError("请填写年龄");
      ageRef.current?.focus();
      return;
    }

    if (!formData.city) {
      setError("请填写城市");
      cityRef.current?.focus();
      return;
    }

    if (!formData.bio) {
      setError("请填写个人简介");
      bioRef.current?.focus();
      return;
    }

    const interests = formData.interestsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
    if (interests.length === 0) {
      setError("请至少输入一个兴趣爱好");
      interestsRef.current?.focus();
      return;
    }

    const needs = formData.needsText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n);
    if (needs.length === 0) {
      setError("请至少输入一个需求");
      needsRef.current?.focus();
      return;
    }

    const provide = formData.provideText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);
    if (provide.length === 0) {
      setError("请至少输入一个提供");
      provideRef.current?.focus();
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setError("请输入有效的年龄（18-100）");
      ageRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      // 调用后端 API 保存用户信息
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          profile: {
            name: formData.name,
            age: ageNum,
            city: formData.city,
            bio: formData.bio,
            interests: interests,
            needs: formData.needsText
              .split("\n")
              .map((n) => n.trim())
              .filter((n) => n),
            provide: formData.provideText
              .split("\n")
              .map((p) => p.trim())
              .filter((p) => p),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        completeProfile();
        updateProfile(data.profile);
        router.push("/");
      } else {
        setError(data.error || "保存失败，请重试");
      }
    } catch (err) {
      // 如果 API 不存在，暂时使用本地状态
      completeProfile();
      updateProfile({
        id: user?.id || "",
        name: formData.name,
        age: ageNum,
        city: formData.city,
        bio: formData.bio,
        interests: interests,
        needs: formData.needsText
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n),
        provide: formData.provideText
          .split("\n")
          .map((p) => p.trim())
          .filter((p) => p),
        avatar: "/avatars/default.svg",
        gender: "",
      });
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>完善个人信息</CardTitle>
          <CardDescription>
            请填写你的个人信息，以便我们更好地为你匹配
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  ref={nameRef}
                  type="text"
                  placeholder="你的姓名"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="age">年龄</Label>
                <Input
                  id="age"
                  ref={ageRef}
                  type="number"
                  placeholder="你的年龄"
                  min="1"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city">城市</Label>
                <Input
                  id="city"
                  ref={cityRef}
                  type="text"
                  placeholder="你所在的城市"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">个人简介</Label>
                <Input
                  id="bio"
                  ref={bioRef}
                  type="text"
                  placeholder="一句话介绍自己"
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="interests">兴趣爱好</Label>
                <Textarea
                  id="interests"
                  ref={interestsRef}
                  placeholder="每行输入一个兴趣爱好"
                  value={formData.interestsText}
                  onChange={(e) =>
                    handleChange("interestsText", e.target.value)
                  }
                  required
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="needs">需求</Label>
                <Textarea
                  id="needs"
                  ref={needsRef}
                  placeholder="每行输入一个需求"
                  value={formData.needsText}
                  onChange={(e) => handleChange("needsText", e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provide">提供</Label>
                <Textarea
                  id="provide"
                  ref={provideRef}
                  placeholder="每行输入一个提供"
                  value={formData.provideText}
                  onChange={(e) => handleChange("provideText", e.target.value)}
                  required
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "保存中..." : "完成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
