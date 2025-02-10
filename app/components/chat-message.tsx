import { NFTDialog } from "@/app/components/nft-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, MoreVertical, Upload } from "lucide-react";
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  isImage?: boolean;
  blobId?: string | null;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [blobId, setBlobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);

  const uploadToWalrus = async (imageData: string) => {
    setIsUploading(true);
    try {
      toast({
        title: "Uploading image to Walrus...",
        description: "Please wait while we process your request.",
      });

      const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

      // Convert base64 to blob if it's a data URL
      const response = await fetch(imageData);
      const blob = await response.blob();

      const address = sessionStorage.getItem("zkLoginAddress");
      let walrusUrl = `${PUBLISHER}/v1/blobs`;
      if (address) {
        walrusUrl = `${PUBLISHER}/v1/blobs?send_object_to=${address}`;
      }
      const walrusResponse = await fetch(walrusUrl, {
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
        message.blobId = newBlobId;
        const conversations = JSON.parse(
          localStorage.getItem("conversations") || "[]"
        );
        const updatedConversations = conversations.map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) =>
            msg.id === message.id
              ? { ...msg, content: newBlobId, blobId: newBlobId }
              : msg
          ),
        }));
        localStorage.setItem(
          "conversations",
          JSON.stringify(updatedConversations)
        );
        toast({
          title: "Upload successful!",
          description: (
            <div className="flex items-center gap-2">
              <span>Blob ID:</span>
              <code
                className="px-2 py-1 bg-muted rounded-md cursor-pointer flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(newBlobId);
                  toast({
                    title: "Copied to clipboard",
                    description: "Blob ID has been copied to your clipboard",
                  });
                }}
              >
                {newBlobId}
                <Copy className="h-4 w-4" />
              </code>
            </div>
          ),
          duration: 5000,
        });
      } else {
        throw new Error("Invalid response format from Walrus");
      }
    } catch (error) {
      console.error("Error uploading to Walrus:", error);
      setBlobId(null);
    } finally {
      setIsUploading(false);
    }
  };

  const dropdownButton = blobId && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(blobId);
            toast({
              title: "Copied to clipboard",
              description: "Blob ID has been copied to your clipboard",
            });
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Blob ID
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => setIsNFTDialogOpen(true)}>
          Create NFT
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
            <TooltipProvider delayDuration={0}>
              {blobId ? (
                dropdownButton
              ) : isUploading ? (
                <button
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </button>
              ) : (
                <button
                  onClick={() => uploadToWalrus(message.content)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload className="h-4 w-4" />
                </button>
              )}
            </TooltipProvider>
          </div>
        ) : (
          <div className="mt-1 p-4">{message.content}</div>
        )}
        <NFTDialog
          isOpen={isNFTDialogOpen}
          onOpenChange={setIsNFTDialogOpen}
          blobId={blobId}
        />
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
