import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, MessageCircle, User } from "lucide-react"

type Conversation = {
  id: string
  title: string
  messages: { role: "user" | "assistant"; content: string }[]
}

type SidebarProps = {
  conversations: Conversation[]
  onSelectConversation: (id: string) => void
  selectedConversation: string | null
  onNewConversation: () => void
}

export function Sidebar({
  conversations,
  onSelectConversation,
  selectedConversation,
  onNewConversation,
}: SidebarProps) {
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4">
        <Button onClick={onNewConversation} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 text-left hover:bg-accent ${
              selectedConversation === conversation.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-center">
              <MessageCircle className="mr-2 h-4 w-4" />
              <div>
                <div className="font-semibold">{conversation.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {conversation.messages[conversation.messages.length - 1].content}
                </div>
              </div>
            </div>
          </button>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
          Account
        </Button>
      </div>
    </div>
  )
}

