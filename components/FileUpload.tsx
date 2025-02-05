import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import type React from "react" // Added import for React

interface FileUploadProps {
  onFileUpload: (files: File[]) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFileUpload(Array.from(event.target.files))
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />
      <Button type="button" onClick={handleClick} variant="outline">
        <Upload className="mr-2 h-4 w-4" /> Upload Image/Video
      </Button>
    </div>
  )
}

