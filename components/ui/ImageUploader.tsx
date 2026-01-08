"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, ImagePlus } from "lucide-react"
import { toast } from "sonner"

interface ImageUploaderProps {
    onUploadComplete: (url: string) => void
    className?: string
    buttonLabel?: string
}

export default function ImageUploader({ onUploadComplete, className = "", buttonLabel = "Upload Photo" }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

            if (!preset || !cloudName) {
                throw new Error("Missing Cloudinary configuration")
            }

            formData.append("upload_preset", preset)

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData
            })

            if (!res.ok) throw new Error("Upload failed")

            const data = await res.json()
            onUploadComplete(data.secure_url)
            toast.success("Image uploaded successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className={`relative ${className}`}>
            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
            />
            <label htmlFor="image-upload" className="w-full">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-full min-h-[40px] gap-2 border-dashed bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    disabled={uploading}
                    asChild
                >
                    <span className="flex items-center justify-center">
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="ml-2 text-gray-600">
                            {uploading ? "Uploading..." : buttonLabel}
                        </span>
                    </span>
                </Button>
            </label>
        </div>
    )
}
