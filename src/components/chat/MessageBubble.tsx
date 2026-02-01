import { motion } from "framer-motion";
import { Bot, User, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageType = "user" | "agent";
export type MessageStatus = "sending" | "sent" | "error";

interface MessageBubbleProps {
  type: MessageType;
  content: string;
  timestamp?: Date;
  status?: MessageStatus;
  isLatest?: boolean;
}

export function MessageBubble({
  type,
  content,
  timestamp,
  status = "sent",
  isLatest = false,
}: MessageBubbleProps) {
  const isUser = type === "user";

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 12, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex gap-2.5 max-w-[88%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-soft",
          isUser ? "bg-primary" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="w-4.5 h-4.5 text-primary-foreground" />
        ) : (
          <Bot className="w-4.5 h-4.5 text-secondary-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-bubble",
            isUser
              ? "bg-bubble-user text-bubble-user-foreground rounded-tr-md"
              : "bg-bubble-agent text-bubble-agent-foreground rounded-tl-md border border-border"
          )}
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>

        {/* Footer: timestamp + status */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-1 text-xs text-muted-foreground",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {timestamp && (
            <span>
              {timestamp.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {isUser && status === "sending" && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-muted-foreground/40"
            />
          )}
          {isUser && status === "sent" && (
            <Check className="w-3.5 h-3.5 text-primary" />
          )}
          {isUser && status === "error" && (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
