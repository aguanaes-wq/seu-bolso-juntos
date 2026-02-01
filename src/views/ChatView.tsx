import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { useChat } from "@/hooks/useChat";

export function ChatView() {
  const { messages, isLoading, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {isEmpty ? (
          <WelcomeMessage />
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                type={message.type}
                content={message.content}
                timestamp={message.timestamp}
                status={message.status}
                isLatest={index === messages.length - 1}
              />
            ))}
            <AnimatePresence>
              {isLoading && messages[messages.length - 1]?.type === "user" && (
                <TypingIndicator />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Ex: gastei 45 no almoço..."
      />
    </div>
  );
}
