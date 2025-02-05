import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PaperclipIcon, SendIcon, SmileIcon } from "lucide-react"

type MessageInputProps = {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>, attachments: File[]) => void
}

export function MessageInput({ input, handleInputChange, onSubmit }: MessageInputProps) {
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(e, attachments)
    setAttachments([])
    if (formRef.current) formRef.current.reset()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end space-x-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <PaperclipIcon className="h-5 w-5" />
        <span className="sr-only">Attach file</span>
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,video/*,.gif"
        className="hidden"
      />
      <div className="flex-1 relative">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[50px] pr-10 py-3 resize-none"
          rows={1}
        />
        <Button type="button" variant="ghost" size="icon" className="absolute right-2 bottom-2 rounded-full">
          <SmileIcon className="h-5 w-5" />
          <span className="sr-only">Insert emoji</span>
        </Button>
      </div>
      <Button type="submit" size="icon" className="rounded-full">
        <SendIcon className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}

