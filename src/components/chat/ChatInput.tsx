import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Paperclip, X, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      alert("Por favor, envie uma imagem ou PDF.");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachedFile({
        name: file.name,
        base64,
        type: isImage ? "image" : "pdf",
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    const hasContent = trimmed || attachedFile;
    
    if (hasContent && !disabled) {
      const message = trimmed || (attachedFile ? "Analisar este comprovante" : "");
      onSend(message, attachedFile?.base64);
      setValue("");
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (value.trim().length > 0 || attachedFile) && !disabled;

  return (
    <div className="w-full px-4 py-3 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border">
      {/* Attached file preview */}
      {attachedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted/50 max-w-2xl mx-auto"
        >
          {attachedFile.type === "image" ? (
            <Image className="w-4 h-4 text-primary" />
          ) : (
            <FileText className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm text-foreground flex-1 truncate">
            {attachedFile.name}
          </span>
          <button
            onClick={removeAttachment}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        {/* File attachment button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Anexar comprovante"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedFile ? "Descreva o comprovante (opcional)..." : placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl px-4 py-3 text-base",
              "bg-muted/50 border border-border",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            style={{ maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 p-3 rounded-full transition-all duration-200",
            canSend
              ? "bg-primary text-primary-foreground shadow-soft hover:shadow-soft-lg"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Enviar mensagem"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
