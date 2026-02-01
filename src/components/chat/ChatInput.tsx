import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
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

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="w-full px-4 py-3 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        {/* Quick action hint */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Gravar áudio (em breve)"
          disabled
        >
          <Mic className="w-5 h-5" />
        </motion.button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
