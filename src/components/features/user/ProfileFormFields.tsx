"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "./AvatarUpload";
import type { User, Gender } from "@/lib/types";

interface ProfileFormFieldsProps {
  /** 初始用户数据（编辑模式传入） */
  initialData?: Partial<User>;
  /** 用户 ID */
  userId: string;
  /** 表单数据变化回调 */
  onChange: (data: ProfileFormData) => void;
  /** 是否显示错误提示 */
  error?: string;
}

export interface ProfileFormData {
  name: string;
  age: string;
  gender: Gender | '';
  city: string;
  bio: string;
  interestsText: string;
  needsText: string;
  provideText: string;
  avatarUrl: string;
}

export function ProfileFormFields({
  initialData,
  userId,
  onChange,
  error = "",
}: ProfileFormFieldsProps) {
  // 初始化表单数据
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialData?.name || "",
    age: initialData?.age?.toString() || "",
    gender: initialData?.gender || "",
    city: initialData?.city || "",
    bio: initialData?.bio || "",
    interestsText: initialData?.interests?.join("\n") || "",
    needsText: initialData?.needs?.join("\n") || "",
    provideText: initialData?.provide?.join("\n") || "",
    avatarUrl: initialData?.avatar || "/avatars/default.svg",
  });

  // 为每个输入框创建 ref
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLInputElement>(null);
  const interestsRef = useRef<HTMLTextAreaElement>(null);
  const needsRef = useRef<HTMLTextAreaElement>(null);
  const provideRef = useRef<HTMLTextAreaElement>(null);

  // 当 initialData 变化时更新表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        age: initialData.age?.toString() || "",
        gender: initialData.gender || "",
        city: initialData.city || "",
        bio: initialData.bio || "",
        interestsText: initialData.interests?.join("\n") || "",
        needsText: initialData.needs?.join("\n") || "",
        provideText: initialData.provide?.join("\n") || "",
        avatarUrl: initialData.avatar || "/avatars/default.svg",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  // 验证并返回处理后的数据
  const validateAndGetData = (): {
    valid: boolean;
    data?: Partial<User>;
    errorField?: string;
    errorMessage?: string;
  } => {
    if (!formData.name) {
      return { valid: false, errorField: "name", errorMessage: "请填写姓名" };
    }

    if (!formData.age) {
      return { valid: false, errorField: "age", errorMessage: "请填写年龄" };
    }

    if (!formData.city) {
      return { valid: false, errorField: "city", errorMessage: "请填写城市" };
    }

    if (!formData.bio) {
      return {
        valid: false,
        errorField: "bio",
        errorMessage: "请填写个人简介",
      };
    }

    const interests = formData.interestsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
    if (interests.length === 0) {
      return {
        valid: false,
        errorField: "interests",
        errorMessage: "请至少输入一个兴趣爱好（最多4个）",
      };
    }
    if (interests.length > 4) {
      return {
        valid: false,
        errorField: "interests",
        errorMessage: "兴趣爱好最多输入4个",
      };
    }

    const needs = formData.needsText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n);
    if (needs.length === 0) {
      return {
        valid: false,
        errorField: "needs",
        errorMessage: "请至少输入一个需求（最多4个）",
      };
    }
    if (needs.length > 4) {
      return {
        valid: false,
        errorField: "needs",
        errorMessage: "需求最多输入4个",
      };
    }

    const provide = formData.provideText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);
    if (provide.length === 0) {
      return {
        valid: false,
        errorField: "provide",
        errorMessage: "请至少输入一个提供（最多4个）",
      };
    }
    if (provide.length > 4) {
      return {
        valid: false,
        errorField: "provide",
        errorMessage: "提供最多输入4个",
      };
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      return {
        valid: false,
        errorField: "age",
        errorMessage: "请输入有效的年龄（1-100）",
      };
    }

    return {
      valid: true,
      data: {
        name: formData.name,
        age: ageNum,
        gender: formData.gender || undefined,
        city: formData.city,
        bio: formData.bio,
        interests,
        needs,
        provide,
        avatar: formData.avatarUrl,
      },
    };
  };

  // 聚焦到指定字段
  const focusField = (fieldName: string) => {
    const refMap: Record<
      string,
      React.RefObject<HTMLInputElement | HTMLTextAreaElement>
    > = {
      name: nameRef,
      age: ageRef,
      city: cityRef,
      bio: bioRef,
      interests: interestsRef,
      needs: needsRef,
      provide: provideRef,
    };
    refMap[fieldName]?.current?.focus();
  };

  return (
    <>
      {/* 头像上传 */}
      <div className="flex justify-center py-4">
        <AvatarUpload
          currentAvatar={formData.avatarUrl}
          userId={userId}
          userName={formData.name || "用户"}
          onAvatarChange={(url) => handleChange("avatarUrl", url)}
          size="lg"
        />
      </div>

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
          placeholder="请输入年龄"
          min="1"
          max="100"
          value={formData.age}
          onChange={(e) => handleChange("age", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">性别</Label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => handleChange("gender", e.target.value as Gender | '')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">请选择</option>
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="city">城市</Label>
        <Input
          id="city"
          ref={cityRef}
          type="text"
          placeholder="例如：北京"
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
          placeholder="每行输入一个，最多4个"
          value={formData.interestsText}
          onChange={(e) => handleChange("interestsText", e.target.value)}
          required
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="needs">需求</Label>
        <Textarea
          id="needs"
          ref={needsRef}
          placeholder="每行输入一个，最多4个"
          value={formData.needsText}
          onChange={(e) => handleChange("needsText", e.target.value)}
          required
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="provide">提供</Label>
        <Textarea
          id="provide"
          ref={provideRef}
          placeholder="每行输入一个，最多4个"
          value={formData.provideText}
          onChange={(e) => handleChange("provideText", e.target.value)}
          required
          rows={4}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
          {error}
        </div>
      )}
    </>
  );
}

// 导出验证方法供父组件使用
export type { ProfileFormData };
