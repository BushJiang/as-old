"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface VerificationCodeInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  disabled = false,
}: VerificationCodeInputProps) {
  const [code, setCode] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, length)
    setCode(value)

    if (value.length === length) {
      onComplete(value)
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="000000"
        value={code}
        onChange={handleChange}
        disabled={disabled}
        className="text-center text-2xl tracking-widest"
        maxLength={length}
        autoFocus
      />
    </div>
  )
}
