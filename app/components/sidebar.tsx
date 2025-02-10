import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MessageCircle, User } from "lucide-react";
import { AccountButton } from "./account-button";
import { NFTDialog } from "./nft-dialog";
import { useState } from "react";

type Conversation = {
  id: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

type SidebarProps = {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  selectedConversation: string | null;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
};

export function Sidebar({
  conversations,
  onSelectConversation,
  selectedConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);

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
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`group w-full p-4 text-left hover:bg-accent cursor-pointer ${
              selectedConversation === conversation.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-center space-x-2 w-full">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0 mr-2 w-4">
                <div className="text-sm text-muted-foreground truncate">
                  {
                    conversation.messages[conversation.messages.length - 1]
                      .content
                  }
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </ScrollArea>
      <AccountButton />
    </div>
  );
}
