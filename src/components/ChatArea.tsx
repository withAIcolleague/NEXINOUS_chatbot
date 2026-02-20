"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Bot, User, MoreVertical, Paperclip } from "lucide-react";

export default function ChatArea() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 쿼리 파라미터 id를 컴포넌트 상태로 저장
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get("id")
  );

  // searchParams가 바뀔 때마다 상태 동기화
  useEffect(() => {
    setConversationId(searchParams.get("id"));
  }, [searchParams]);

  const [isCreating, setIsCreating] = useState(false);

  const handleNewConversation = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "새 대화" }),
      });
      if (!res.ok) {
        toast.error("대화 생성에 실패했습니다.");
        return;
      }
      const newConv = await res.json();
      router.push(`?id=${newConv.id}`);
      toast.success("새 대화가 시작되었습니다.");
    } catch {
      toast.error("대화 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || status !== "ready") return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const now = () =>
    new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-background">
      {/* Header — 항상 표시 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="font-semibold text-foreground">NEXINOUS AI Chat</h1>
          <p className="text-xs text-muted-foreground mt-0.5">gpt-5-mini</p>
        </div>
        <button className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!conversationId ? (
          // id 없을 때 — 초기 화면
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              새로운 대화를 시작하거나 왼쪽에서 기존 대화를 선택해주세요.
            </p>
            <button
              type="button"
              onClick={handleNewConversation}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "생성 중..." : "새 대화 시작하기"}
            </button>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  무엇을 도와드릴까요?
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === "assistant"
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                      }`}
                  >
                    {msg.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {now()}
                  </span>
                </div>
              </div>
            ))}

            {/* 스트리밍 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-3">
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors mb-0.5 shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none overflow-y-auto disabled:opacity-50"
            style={{ maxHeight: "128px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={status !== "ready" || !input.trim()}
            className="p-1.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-all mb-0.5 shrink-0 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI는 실수를 할 수 있습니다. 중요한 정보는 반드시 확인하세요.
        </p>
      </div>
    </div>
  );
}
