import { useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageInput } from "./message-input"
import { ChatMessage } from "./chat-message"

type Conversation = {
  id: string
  title: string
  messages: { role: "user" | "assistant"; content: string }[]
}

type ChatInterfaceProps = {
  conversationId: string | null
  conversations: Conversation[]
  updateConversation: (id: string, messages: { role: "user" | "assistant"; content: string }[]) => void
}

export function ChatInterface({ conversationId, conversations, updateConversation }: ChatInterfaceProps) {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        setMessages(conversation.messages)
      }
    }
  }, [conversationId, conversations, setMessages])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [scrollAreaRef]) //Corrected dependency

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>, attachments: File[]) => {
    e.preventDefault()
    if (!conversationId || !input.trim()) return

    const updatedMessages = [...messages, { role: "user" as const, content: input }]

    // Handle file attachments
    for (const file of attachments) {
      const fileContent = await readFileAsDataURL(file)
      updatedMessages.push({ role: "user" as const, content: fileContent })
    }

    setMessages(updatedMessages)
    updateConversation(conversationId, updatedMessages)

    // Call AI API
    handleSubmit(e)
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <MessageInput input={input} handleInputChange={handleInputChange} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

