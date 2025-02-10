import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, X } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

type MessageInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, attachments: File[]) => void;
  disabled?: boolean;
};

export function MessageInput({
  input,
  handleInputChange,
  onSubmit,
  disabled,
}: MessageInputProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(files);

      // Generate previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e, attachments);
    setAttachments([]);
    setPreviews([]);
    if (formRef.current) formRef.current.reset();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {previews.length > 0 && (
        <div className="flex gap-2 p-2 overflow-x-auto">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-row items-center space-x-2"
      >
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button> */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,video/*,.gif"
          className="hidden"
        />
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[50px] pr-10 py-3 resize-none"
            rows={1}
          />
          {/* <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 rounded-full"
          >
            <SmileIcon className="h-5 w-5" />
            <span className="sr-only">Insert emoji</span>
          </Button> */}
        </div>
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={disabled}
        >
          <SendIcon className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
