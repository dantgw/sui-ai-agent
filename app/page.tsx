"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { ChatInterface } from "./components/chat-interface";

type Conversation = {
  id: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Load conversations from local storage or initialize with sample data
    const storedConversations = localStorage.getItem("conversations");
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations));
    } else {
      const initialConversations: Conversation[] = [
        {
          id: "1",
          messages: [
            { role: "assistant", content: "Hello! How can I help you today?" },
          ],
        },
        {
          id: "2",
          messages: [
            {
              role: "assistant",
              content: "Welcome back! What would you like to discuss?",
            },
          ],
        },
      ];
      setConversations(initialConversations);
      localStorage.setItem(
        "conversations",
        JSON.stringify(initialConversations)
      );
    }
  }, []);

  const updateConversation = (
    id: string,
    messages: { role: "user" | "assistant"; content: string }[]
  ) => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === id ? { ...conv, messages } : conv
    );
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
  };

  const addNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      messages: [{ role: "assistant", content: "How can I assist you today?" }],
    };
    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
    setSelectedConversation(newConversation.id);
  };

  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter((conv) => conv.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
    if (selectedConversation === id) {
      setSelectedConversation(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar
        conversations={conversations}
        onSelectConversation={setSelectedConversation}
        selectedConversation={selectedConversation}
        onNewConversation={addNewConversation}
        onDeleteConversation={deleteConversation}
      />
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={selectedConversation}
          conversations={conversations}
          updateConversation={updateConversation}
        />
      </main>
    </div>
  );
}
