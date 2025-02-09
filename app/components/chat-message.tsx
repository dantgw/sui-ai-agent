import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  isImage?: boolean;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

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
          <img
            src={message.content}
            alt="AI generated image"
            className="max-w-full h-auto rounded-lg mt-2"
          />
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
