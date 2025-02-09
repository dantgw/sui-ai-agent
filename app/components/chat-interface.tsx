import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "./message-input";
import { ChatMessage } from "./chat-message";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";

import {
  genAddressSeed,
  getZkLoginSignature,
  getExtendedEphemeralPublicKey,
} from "@mysten/sui/zklogin";
import { PartialZkLoginSignature } from "@/lib/types";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

type Conversation = {
  id: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

type ChatInterfaceProps = {
  conversationId: string | null;
  conversations: Conversation[];
  updateConversation: (
    id: string,
    messages: { role: "user" | "assistant"; content: string }[]
  ) => void;
  setSelectedConversation: (id: string) => void;
};

export function ChatInterface({
  conversationId,
  conversations,
  updateConversation,
  setSelectedConversation,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; id: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSuiTransaction = async (functionArgs: any) => {
    try {
      const { recipientAddress, amount } = functionArgs;

      // Get stored zkLogin data
      const zkLoginData = sessionStorage.getItem("zkLoginData");
      const jwt = localStorage.getItem("id_token");
      const userSalt = localStorage.getItem("userSalt");

      if (!zkLoginData || !jwt || !userSalt) {
        throw new Error("Missing zkLogin data. Please login again.");
      }

      const { ephemeralPrivateKey, maxEpoch, randomness } =
        JSON.parse(zkLoginData);
      const ephemeralKeyPair = keypairFromSecretKey(ephemeralPrivateKey);

      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeralKeyPair.getPublicKey()
      );

      const response = await fetch("https://prover-dev.mystenlabs.com/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jwt: jwt,
          extendedEphemeralPublicKey: extendedEphemeralPublicKey,
          maxEpoch: maxEpoch,
          jwtRandomness: randomness,
          salt: userSalt,
          keyClaimName: "sub",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const zkProofResponse = await response.json();
      const zkProofResult = zkProofResponse.data;

      const partialZkLoginSignature = zkProofResult as PartialZkLoginSignature;

      // Initialize Sui client
      const client = new SuiClient({
        url:
          process.env.NEXT_PUBLIC_SUI_RPC_URL ||
          "https://fullnode.devnet.sui.io",
      });

      // Create transaction block
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      tx.transferObjects([coin], recipientAddress);

      // Decode JWT to get sub and aud
      const decodedJwt = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString()
      );

      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        "sub",
        decodedJwt.sub,
        decodedJwt.aud
      ).toString();

      // Sign transaction with ephemeral key
      const { bytes, signature: userSignature } = await tx.sign({
        client,
        signer: ephemeralKeyPair,
      });

      // Generate complete zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkLoginSignature,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });

      // Execute transaction
      const txResponse = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      return {
        status: "success",
        txHash: txResponse.digest,
        amount,
        recipient: recipientAddress,
      };
    } catch (error) {
      console.error("Sui Transaction Error:", error);
      throw new Error("Failed to send Sui tokens: " + (error as Error).message);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    attachments: File[] = []
  ) => {
    e.preventDefault();

    if (!input.trim() && attachments.length === 0) return;

    if (!conversationId) {
      // Create new conversation with the user's message
      const newConversationId = Date.now().toString();
      const userMessage = {
        role: "user" as const,
        content: input.trim(),
        id: crypto.randomUUID(),
      };

      // Initialize new conversation with the user's message
      const newMessages = [userMessage];

      // Add the new conversation to localStorage
      const updatedConversations = [
        ...conversations,
        {
          id: newConversationId,
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        },
      ];
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );

      // Update the conversation
      updateConversation(
        newConversationId,
        newMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
      setSelectedConversation(newConversationId);

      // Continue with the normal message flow using the new conversation ID
      conversationId = newConversationId;
      setMessages(newMessages);
      setInput("");
    }

    setIsLoading(true);
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
      const userMessage = {
        role: "user" as const,
        content: input.trim(),
        id: crypto.randomUUID(),
      };

      updatedMessages = [...updatedMessages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      try {
        const response = await fetch("/api/chat", {
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
        console.log("response", response);
        const data = await response.json();

        // Handle function calls on the frontend
        if (data.executeOnFrontend && data.functionName === "sendSuiTokens") {
          const functionArgs = JSON.parse(data.args);
          const result = await handleSuiTransaction(functionArgs);

          // Add function result to messages
          const functionResultMessage = {
            role: "function" as const,
            content: JSON.stringify(result),
            id: crypto.randomUUID(),
          };

          updatedMessages = [
            ...updatedMessages,
            data.message,
            functionResultMessage,
          ];

          // Get final response from API
          const finalResponse = await fetch("/api/chat", {
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

          const finalData = await finalResponse.json();
          data.message = finalData.message;
        }

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

function keypairFromSecretKey(privateKeyBase64: string): Ed25519Keypair {
  const keyPair = decodeSuiPrivateKey(privateKeyBase64);
  return Ed25519Keypair.fromSecretKey(keyPair.secretKey);
}
