"use client";

import { useCallback, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function PhotoUpload({
  value,
  onChange,
  initials = "?",
  size = "md",
  className = "",
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image must be less than 2MB");
        return;
      }

      setIsLoading(true);

      try {
        // Resize and compress the image
        const resizedDataUrl = await resizeImage(file, 400, 400, 0.8);
        onChange(resizedDataUrl);
        toast.success("Photo uploaded");
      } catch {
        toast.error("Failed to process image");
      } finally {
        setIsLoading(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(undefined);
    toast.success("Photo removed");
  }, [onChange]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={`${sizeClasses[size]} border-2 border-border shadow-sm`}>
        {value && <AvatarImage src={value} alt="Profile photo" />}
        <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            initials
          )}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload photo"
      />

      <div className="absolute -bottom-1 -right-1 flex gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full shadow-md"
          onClick={triggerFileSelect}
          disabled={isLoading}
        >
          {value ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>

        {value && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={handleRemove}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Resize an image file to fit within max dimensions while maintaining aspect ratio
 */
async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw and export as WebP (smaller) or JPEG fallback
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      let dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    // Load the image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
