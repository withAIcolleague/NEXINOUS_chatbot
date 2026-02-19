"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MoreVertical, Paperclip } from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "안녕하세요! 무엇을 도와드릴까요?",
    time: "10:00",
  },
  {
    id: 2,
    role: "user",
    content: "Next.js 15에서 App Router를 사용하는 방법을 알려줘",
    time: "10:01",
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Next.js 15의 App Router는 `app/` 디렉토리를 기반으로 동작합니다.\n\n기본 폴더 구조:\n\n  app/\n    layout.tsx  → 공통 레이아웃\n    page.tsx    → 메인 페이지 ( / )\n    about/\n      page.tsx  → /about 페이지\n\n각 폴더가 URL 경로가 되며, `page.tsx` 파일이 해당 경로의 UI를 담당합니다. `layout.tsx`는 자식 페이지를 감싸는 공통 레이아웃으로 사용됩니다.",
    time: "10:01",
  },
];

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 텍스트에 따라 textarea 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: input.trim(), time: now },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="font-semibold text-foreground">Next.js 프로젝트 설정 방법</h1>
          <p className="text-xs text-muted-foreground mt-0.5">claude-sonnet-4-6</p>
        </div>
        <button className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
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
              className={`flex flex-col gap-1 max-w-[70%] ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "assistant"
                    ? "bg-muted text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-3">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors mb-0.5 shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none overflow-y-auto"
            style={{ maxHeight: "128px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
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
