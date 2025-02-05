import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

type ChatMessageProps = {
  message: { role: "user" | "assistant"; content: string }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex items-start space-x-2 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar>
          <AvatarImage src="/ai-avatar.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <Card className={`p-4 max-w-[70%] ${isUser ? "bg-primary text-primary-foreground" : ""}`}>
        {renderMessageContent(message.content)}
      </Card>
    </div>
  )
}

function renderMessageContent(content: string) {
  if (content.startsWith("data:image")) {
    return <img src={content || "/placeholder.svg"} alt="Uploaded image" className="max-w-full rounded" />
  } else if (content.startsWith("data:video")) {
    return (
      <video controls className="max-w-full rounded">
        <source src={content} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    )
  } else {
    return <p>{content}</p>
  }
}

