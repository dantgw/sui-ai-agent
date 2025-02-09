import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Upload, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  isImage?: boolean;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [blobId, setBlobId] = useState<string | null>(null);

  const uploadToWalrus = async (imageData: string) => {
    try {
      const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

      // Convert base64 to blob if it's a data URL
      const response = await fetch(imageData);
      const blob = await response.blob();

      const walrusResponse = await fetch(`${PUBLISHER}/v1/blobs`, {
        method: "PUT",
        body: blob,
      });

      const result = await walrusResponse.json();

      // Handle both new and existing blob cases
      const newBlobId =
        result.newlyCreated?.blobObject?.blobId ||
        result.alreadyCertified?.blobId;

      if (newBlobId) {
        setBlobId(newBlobId);
      } else {
        throw new Error("Invalid response format from Walrus");
      }
    } catch (error) {
      console.error("Error uploading to Walrus:", error);
      setBlobId(null);
    }
  };

  return (
    <div
      className={`flex items-start space-x-2 mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <Avatar>
          <AvatarImage src="/ai-avatar.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={`max-w-[70%] ${
          isUser ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        {message.isImage ? (
          <div className="space-y-2 relative group">
            <img
              src={message.content}
              alt="AI generated image"
              className="max-w-full h-auto rounded-lg"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !blobId && uploadToWalrus(message.content)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {blobId ? (
                      <Info className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {blobId ? (
                    <p>Blob ID: {blobId}</p>
                  ) : (
                    <p>Upload image to Walrus</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="mt-1 p-4">{message.content}</div>
        )}
      </Card>
    </div>
  );
}

function renderMessageContent(content: string) {
  if (content?.startsWith("data:image")) {
    return (
      <div className="message-image">
        <img
          src={content}
          alt="Uploaded image"
          className="max-w-full h-auto rounded-lg"
          loading="lazy"
        />
      </div>
    );
  } else if (content?.startsWith("data:video")) {
    return (
      <video controls className="max-w-full rounded-lg">
        <source src={content} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  } else {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
}
