import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "./message-input";
import { ChatMessage } from "./chat-message";

type Conversation = {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

type ChatInterfaceProps = {
  conversationId: string | null;
  conversations: Conversation[];
  updateConversation: (
    id: string,
    messages: { role: "user" | "assistant"; content: string }[]
  ) => void;
};

export function ChatInterface({
  conversationId,
  conversations,
  updateConversation,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; id: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    attachments: File[] = []
  ) => {
    e.preventDefault();
    if (!conversationId || (!input.trim() && attachments.length === 0)) return;

    let updatedMessages = [...messages];

    // Handle file attachments if any
    if (attachments.length > 0) {
      for (const file of attachments) {
        const fileContent = await readFileAsDataURL(file);
        const newMessage = {
          role: "user" as const,
          content: fileContent,
          id: crypto.randomUUID(),
        };
        updatedMessages.push(newMessage);
      }
      setMessages(updatedMessages);
      updateConversation(
        conversationId,
        updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    }

    // Handle text input
    if (input.trim()) {
      setIsLoading(true);
      const userMessage = {
        role: "user" as const,
        content: input.trim(),
        id: crypto.randomUUID(),
      };

      updatedMessages = [...updatedMessages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      try {
        const response = await fetch("/api/atoma", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch response");

        const data = await response.json();
        const assistantMessage = {
          role: "assistant" as const,
          content: data.message.content,
          id: crypto.randomUUID(),
        };

        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);
        updateConversation(
          conversationId,
          newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      } catch (error) {
        console.error("Chat error:", error);
        // Optionally handle error in UI
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        setMessages(
          conversation.messages.map((msg) => ({
            ...msg,
            id: crypto.randomUUID(),
          }))
        );
      }
    }
  }, [conversationId, conversations, setMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [scrollAreaRef]); //Corrected dependency

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="text-sm text-gray-500">AI is thinking...</div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <MessageInput
          input={input}
          handleInputChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
