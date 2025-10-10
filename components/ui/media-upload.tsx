"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageIcon, Video, Upload, X, Eye, Download, AlertTriangle, CheckCircle, Loader2, Crop } from "lucide-react"
import Image from "next/image"

interface MediaFile {
  file: File
  preview: string
  id: string
  status: "uploading" | "success" | "error"
  progress: number
  compressed?: File
}

interface MediaUploadProps {
  type: "image" | "video" | "mixed"
  title: string
  description: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedFormats?: string[]
  onFilesChange: (files: File[]) => void
  onError?: (error: string) => void
  className?: string
  showPreview?: boolean
  enableCompression?: boolean
  enableCropping?: boolean
}

export function MediaUpload({
  type = "image",
  title,
  description,
  multiple = false,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats,
  onFilesChange,
  onError,
  className = "",
  showPreview = true,
  enableCompression = true,
  enableCropping = false,
}: MediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Default accepted formats based on type
  const getAcceptedTypes = () => {
    if (acceptedFormats) {
      return acceptedFormats.reduce(
        (acc, format) => {
          acc[`${type}/*`] = [...(acc[`${type}/*`] || []), `.${format}`]
          return acc
        },
        {} as Record<string, string[]>,
      )
    }

    switch (type) {
      case "image":
        return { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }
      case "video":
        return { "video/*": [".mp4", ".mov", ".avi", ".webm"] }
      case "mixed":
        return {
          "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
          "video/*": [".mp4", ".mov", ".avi", ".webm"],
        }
      default:
        return {}
    }
  }

  // Compress image file
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new window.Image()

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    setIsProcessing(true)

    const newMediaFiles: MediaFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
      status: "uploading" as const,
      progress: 0,
    }))

    setMediaFiles((prev) => [...prev, ...newMediaFiles])

    // Process each file
    for (let i = 0; i < newMediaFiles.length; i++) {
      const mediaFile = newMediaFiles[i]

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setMediaFiles((prev) => prev.map((f) => (f.id === mediaFile.id ? { ...f, progress } : f)))
        }

        // Compress image if enabled
        let processedFile = mediaFile.file
        if (enableCompression && type === "image" && mediaFile.file.type.startsWith("image/")) {
          processedFile = await compressImage(mediaFile.file)
        }

        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id ? { ...f, status: "success" as const, compressed: processedFile } : f,
          ),
        )
      } catch (error) {
        setMediaFiles((prev) => prev.map((f) => (f.id === mediaFile.id ? { ...f, status: "error" as const } : f)))
        onError?.(`Failed to process ${mediaFile.file.name}`)
      }
    }

    setIsProcessing(false)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const { file, errors } = rejection
        errors.forEach((error: any) => {
          if (error.code === "file-too-large") {
            onError?.(`${file.name} is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
          } else if (error.code === "file-invalid-type") {
            onError?.(`${file.name} is not a supported file type`)
          }
        })
      })

      // Check max files limit
      if (mediaFiles.length + acceptedFiles.length > maxFiles) {
        onError?.(`Maximum ${maxFiles} files allowed`)
        return
      }

      if (acceptedFiles.length > 0) {
        processFiles(acceptedFiles)
      }
    },
    [mediaFiles.length, maxFiles, maxSize, onError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    multiple,
    maxSize,
    disabled: isProcessing,
    noClick: true,
    noKeyboard: true,
  })

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (id: string) => {
    setMediaFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      return updated
    })
  }

  const clearAll = () => {
    mediaFiles.forEach((file) => URL.revokeObjectURL(file.preview))
    setMediaFiles([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  useEffect(() => {
    const successfulFiles = mediaFiles.filter((f) => f.status === "success").map((f) => f.compressed || f.file)
    onFilesChange(successfulFiles)
  }, [mediaFiles])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-105"
            : mediaFiles.length > 0
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />

        <div className="space-y-4">
          {isProcessing ? (
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
          ) : mediaFiles.length > 0 ? (
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          ) : type === "image" ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
          ) : type === "video" ? (
            <Video className="h-12 w-12 text-muted-foreground mx-auto" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
          )}

          <div className="space-y-2">
            <p className="font-medium">
              {isDragActive
                ? "Drop the files here"
                : isProcessing
                  ? "Processing files..."
                  : mediaFiles.length > 0
                    ? `${mediaFiles.length} file${mediaFiles.length > 1 ? "s" : ""} uploaded`
                    : "Drag & drop or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              {Object.values(getAcceptedTypes()).flat().join(", ").toUpperCase()} up to{" "}
              {(maxSize / 1024 / 1024).toFixed(1)}MB
              {multiple && ` (max ${maxFiles} files)`}
            </p>
          </div>

          {mediaFiles.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} type="button">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* File Previews */}
      {showPreview && mediaFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploaded Files</h4>
            <Badge variant="secondary">{mediaFiles.length} files</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaFiles.map((mediaFile) => (
              <div key={mediaFile.id} className="relative border rounded-lg p-3 space-y-3 bg-card">
                {/* Preview */}
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  {mediaFile.file.type.startsWith("image/") ? (
                    <Image
                      src={mediaFile.preview || "/placeholder.svg"}
                      alt={mediaFile.file.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status Overlay */}
                  {mediaFile.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <Progress value={mediaFile.progress} className="w-20" />
                      </div>
                    </div>
                  )}

                  {mediaFile.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removeFile(mediaFile.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate" title={mediaFile.file.name}>
                      {mediaFile.file.name}
                    </p>
                    <Badge
                      variant={
                        mediaFile.status === "success"
                          ? "default"
                          : mediaFile.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {mediaFile.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(mediaFile.file.size)}</span>
                    {mediaFile.compressed && (
                      <span className="text-green-600">Compressed ({formatFileSize(mediaFile.compressed.size)})</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="h-7 px-2 bg-transparent">
                      <Eye className="h-3 w-3" />
                    </Button>
                    {enableCropping && mediaFile.file.type.startsWith("image/") && (
                      <Button variant="outline" size="sm" className="h-7 px-2 bg-transparent">
                        <Crop className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-7 px-2 bg-transparent">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Stats */}
      {mediaFiles.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {mediaFiles.filter((f) => f.status === "success").length} of {mediaFiles.length} files uploaded successfully
            {enableCompression && (
              <>
                {" "}
                • Compression saved{" "}
                {formatFileSize(
                  mediaFiles.reduce((acc, f) => acc + (f.compressed ? f.file.size - f.compressed.size : 0), 0),
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
