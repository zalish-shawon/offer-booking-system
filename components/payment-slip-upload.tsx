"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentSlipUploadProps {
  onFileChange: (file: File | null) => void
  initialPreview?: string | null
}

export function PaymentSlipUpload({ onFileChange, initialPreview = null }: PaymentSlipUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileChange(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onFileChange(null)
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border">
            <Image src={preview || "/placeholder.svg"} alt="Payment slip preview" fill className="object-contain p-2" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="payment-slip"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or PDF (max 10MB)</p>
          </div>
          <input
            id="payment-slip"
            type="file"
            accept="image/png, image/jpeg, application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  )
}
