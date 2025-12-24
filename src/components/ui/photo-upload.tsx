"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, Upload, ZoomIn, RotateCcw, Check } from "lucide-react";
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
const CROP_SIZE = 300; // Size of the crop area

export function PhotoUpload({
  value,
  onChange,
  initials = "?",
  size = "md",
  className = "",
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Crop dialog state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Draw the image on canvas whenever zoom/position changes
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    // Clear canvas
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Calculate scaled dimensions
    const scale = zoom;
    const imgWidth = originalImage.width * scale;
    const imgHeight = originalImage.height * scale;

    // Center the image with offset
    const x = (CROP_SIZE - imgWidth) / 2 + position.x;
    const y = (CROP_SIZE - imgHeight) / 2 + position.y;

    ctx.drawImage(originalImage, x, y, imgWidth, imgHeight);
  }, [originalImage, zoom, position]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      try {
        // Load the image
        const img = await loadImageFromFile(file);
        setOriginalImage(img);

        // Calculate initial zoom to fit the image
        const minDim = Math.min(img.width, img.height);
        const initialZoom = CROP_SIZE / minDim;
        setZoom(Math.max(initialZoom, 0.5));
        setPosition({ x: 0, y: 0 });

        setShowCropDialog(true);
      } catch {
        toast.error("Failed to load image");
      } finally {
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleReset = useCallback(() => {
    if (!originalImage) return;
    const minDim = Math.min(originalImage.width, originalImage.height);
    const initialZoom = CROP_SIZE / minDim;
    setZoom(Math.max(initialZoom, 0.5));
    setPosition({ x: 0, y: 0 });
  }, [originalImage]);

  const handleConfirmCrop = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setShowCropDialog(false);

    try {
      // Get the cropped image from canvas and compress it
      const croppedDataUrl = await compressCanvasImage(canvasRef.current, MAX_OUTPUT_SIZE);
      onChange(croppedDataUrl);
      toast.success("Photo uploaded");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsLoading(false);
      setOriginalImage(null);
    }
  }, [onChange]);

  const handleCancelCrop = useCallback(() => {
    setShowCropDialog(false);
    setOriginalImage(null);
  }, []);

  const handleRemove = useCallback(() => {
    onChange(undefined);
    toast.success("Photo removed");
  }, [onChange]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
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

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={(open) => !open && handleCancelCrop()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Photo</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="flex justify-center">
              <div
                className="relative overflow-hidden rounded-full border-4 border-primary/20 cursor-move select-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <canvas
                  ref={canvasRef}
                  width={CROP_SIZE}
                  height={CROP_SIZE}
                  className="pointer-events-none"
                />
                {/* Center guide */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
                </div>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-3 px-4">
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.1}
                max={3}
                step={0.05}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleReset}
                aria-label="Reset position"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelCrop}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCrop}>
              <Check className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Load an image from a File object
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Compress a canvas image to fit within size limits
 */
async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  maxBytes: number
): Promise<string> {
  // Try WebP first (better compression), fallback to JPEG
  const formats = ["image/webp", "image/jpeg"];

  for (const format of formats) {
    for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
      const dataUrl = canvas.toDataURL(format, quality);

      if (format === "image/webp" && !dataUrl.startsWith("data:image/webp")) {
        break;
      }

      const size = getDataUrlSize(dataUrl);
      if (size <= maxBytes) {
        return dataUrl;
      }
    }
  }

  // Last resort
  return canvas.toDataURL("image/jpeg", 0.5);
}
