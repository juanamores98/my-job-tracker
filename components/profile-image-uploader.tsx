"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper from "react-easy-crop"
import { useDropzone } from "react-dropzone"
import { Camera, Trash2, Upload } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileImageUploaderProps {
  value?: string
  onChange: (value?: string) => void
}

interface CroppedArea {
  width: number
  height: number
  x: number
  y: number
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

const getCroppedImage = async (imageSrc: string, croppedAreaPixels: CroppedArea, rotation = 0) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("2D context not available")
  }

  const safeArea = Math.max(image.width, image.height) * 2
  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2)

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  ctx.putImageData(
    data,
    Math.round(-safeArea / 2 + image.width / 2 - croppedAreaPixels.x),
    Math.round(-safeArea / 2 + image.height / 2 - croppedAreaPixels.y),
  )

  return canvas.toDataURL("image/png")
}

export function ProfileImageUploader({ value, onChange }: ProfileImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(value)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setPreview(value)
  }, [value])

  const onCropComplete = useCallback((_: CroppedArea, croppedPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string)
      setIsDialogOpen(true)
    })
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: false,
  })

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImage(imageSrc, croppedAreaPixels)
      setPreview(croppedImage)
      onChange(croppedImage)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to crop image", error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, onChange])

  const handleRemove = () => {
    setPreview(undefined)
    onChange(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border border-border/60">
          {preview ? (
            <AvatarImage src={preview} alt="Profile preview" />
          ) : (
            <AvatarFallback>
              <Camera className="h-5 w-5" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-2">
          <div
            {...getRootProps({
              className:
                "flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary",
            })}
          >
            <input {...getInputProps()} />
            <Upload className="h-4 w-4" />
            {isDragActive ? "Drop the photo here" : "Drag and drop or click to upload"}
          </div>
          {preview && (
            <Button variant="outline" size="sm" onClick={handleRemove} className="text-xs">
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove photo
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Adjust your photo</DialogTitle>
          </DialogHeader>
          <div className="relative mt-4 h-72 overflow-hidden rounded-md bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Zoom</p>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? (
                <span className="flex items-center gap-2 text-sm">Processing...</span>
              ) : (
                "Save photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
