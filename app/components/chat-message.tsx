import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useState } from "react";

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
        className={`p-4 max-w-[70%] ${
          isUser ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        {message.isImage ? (
          <div className="space-y-2">
            <img
              src={message.content}
              alt="AI generated image"
              className="max-w-full h-auto rounded-lg"
            />
            <button
              onClick={() => uploadToWalrus(message.content)}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 w-12"
            >
              Upload to Walrus
            </button>
            {blobId && (
              <div className="text-sm mt-2 p-2 bg-muted rounded">
                <p>
                  <span className="font-semibold">Blob ID:</span> {blobId}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">{message.content}</div>
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
