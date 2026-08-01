"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { ZoomIn, ZoomOut } from "lucide-react";

// ---------------------------------------------------------------------------
// Canvas crop utility
// ---------------------------------------------------------------------------

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 512,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context not available");

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL("image/png");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Base64 ou URL da imagem a ser cortada */
  imageSrc: string;
  /** Callback com a imagem cortada em base64 */
  onCropComplete: (croppedImage: string) => void;
  /** Aspect ratio do crop (default 1 = quadrado) */
  aspectRatio?: number;
  /** Título do dialog */
  title?: string;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  title = "Ajustar Imagem",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onOpenChange(false);
    } catch {
      // silently fail
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Crop area */}
        <div className="relative w-full h-[350px] bg-black/90 rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              cropShape="rect"
              showGrid={false}
            />
          )}
        </div>

        {/* Zoom control */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </Dialog>
  );
}
