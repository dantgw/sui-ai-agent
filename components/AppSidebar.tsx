"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { LogIn, Plus, MessageSquare } from "lucide-react"

interface Conversation {
  id: string
  title: string
}

export function AppSidebar({ onSelectConversation }: { onSelectConversation: (id: string) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "Conversation 1" },
    { id: "2", title: "Conversation 2" },
    { id: "3", title: "Conversation 3" },
  ])

  const handleLogin = () => {
    // Implement login functionality here
    console.log("Login clicked")
  }

  const handleNewConversation = () => {
    const newId = (conversations.length + 1).toString()
    const newConversation = { id: newId, title: `Conversation ${newId}` }
    setConversations([...conversations, newConversation])
    onSelectConversation(newId)
  }

  return (
    <Sidebar className="w-64 border-r">
      <SidebarHeader className="p-4">
        <Button onClick={handleNewConversation} className="w-full">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {conversations.map((conv) => (
            <SidebarMenuItem key={conv.id}>
              <SidebarMenuButton onClick={() => onSelectConversation(conv.id)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {conv.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button onClick={handleLogin} className="w-full">
          <LogIn className="mr-2 h-4 w-4" /> Connect Account
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

