"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { FileUpload } from "@/components/FileUpload"

export function ChatUI({ conversationId }: { conversationId: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({ id: conversationId })
  const [files, setFiles] = useState<File[]>([])

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles([...files, ...uploadedFiles])
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e)
    // Here you would typically process the files, e.g., upload them to a server
    console.log("Uploaded files:", files)
    setFiles([])
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <Card className="flex-grow overflow-auto mb-4 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block p-2 rounded-lg ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <div className="flex gap-2">
          <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-grow" />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  )
}

