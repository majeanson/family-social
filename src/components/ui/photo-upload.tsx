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

const MAX_OUTPUT_SIZE = 500 * 1024; // 500KB max for stored image
const MAX_DIMENSION = 800; // Max width/height

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

      setIsLoading(true);

      try {
        // Resize and compress the image (handles any file size)
        const resizedDataUrl = await resizeAndCompressImage(file, MAX_DIMENSION, MAX_OUTPUT_SIZE);
        onChange(resizedDataUrl);
        toast.success("Photo uploaded");
      } catch (err) {
        console.error("Image processing error:", err);
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
          aria-label={value ? "Change photo" : "Upload photo"}
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
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get the byte size of a data URL
 */
function getDataUrlSize(dataUrl: string): number {
  // Remove the data URL prefix to get just the base64 data
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  // Base64 encodes 3 bytes into 4 characters
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Resize and compress an image to fit within size limits
 * Progressively reduces quality if needed to meet size target
 */
async function resizeAndCompressImage(
  file: File,
  maxDimension: number,
  maxBytes: number
): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  let { width, height } = img;

  // Calculate new dimensions maintaining aspect ratio
  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first (better compression), fallback to JPEG
  const formats = ["image/webp", "image/jpeg"];

  for (const format of formats) {
    // Start with high quality and reduce if needed
    for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
      const dataUrl = canvas.toDataURL(format, quality);

      // Check if format is supported (some browsers don't support WebP)
      if (format === "image/webp" && !dataUrl.startsWith("data:image/webp")) {
        break; // Try next format
      }

      const size = getDataUrlSize(dataUrl);
      if (size <= maxBytes) {
        return dataUrl;
      }
    }
  }

  // If still too large, reduce dimensions and try again
  const smallerDimension = Math.round(maxDimension * 0.5);
  if (smallerDimension >= 200) {
    // Resize smaller
    let newWidth = width;
    let newHeight = height;

    if (newWidth > newHeight) {
      if (newWidth > smallerDimension) {
        newHeight = Math.round((newHeight * smallerDimension) / newWidth);
        newWidth = smallerDimension;
      }
    } else {
      if (newHeight > smallerDimension) {
        newWidth = Math.round((newWidth * smallerDimension) / newHeight);
        newHeight = smallerDimension;
      }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    return dataUrl;
  }

  // Last resort: return lowest quality JPEG
  return canvas.toDataURL("image/jpeg", 0.5);
}
