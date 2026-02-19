"use client";

import { useState } from "react";
import { MessageSquare, Plus, Search, MoreHorizontal } from "lucide-react";

const conversations = [
  {
    id: 1,
    title: "Next.js 프로젝트 설정 방법",
    preview: "Next.js 15에서 App Router를...",
    time: "방금 전",
  },
  {
    id: 2,
    title: "TypeScript 타입 오류 해결",
    preview: "interface와 type의 차이점은...",
    time: "1시간 전",
  },
  {
    id: 3,
    title: "Tailwind CSS 레이아웃",
    preview: "flexbox와 grid 중 어떤 것을...",
    time: "3시간 전",
  },
  {
    id: 4,
    title: "React 상태 관리 패턴",
    preview: "useState vs useReducer...",
    time: "어제",
  },
  {
    id: 5,
    title: "REST API 연동 방법",
    preview: "fetch와 axios 중 어느 것이...",
    time: "어제",
  },
  {
    id: 6,
    title: "데이터베이스 스키마 설계",
    preview: "PostgreSQL에서 관계를...",
    time: "2일 전",
  },
];

export default function Sidebar() {
  const [activeId, setActiveId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const today = conversations.filter((c) => ["방금 전", "1시간 전", "3시간 전"].includes(c.time));
  const yesterday = conversations.filter((c) => c.time === "어제");
  const older = conversations.filter((c) => c.time === "2일 전");

  const filterGroup = (group: typeof conversations) =>
    group.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">AI Chat</span>
        </div>
        <button
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          title="새 대화"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
          <input
            type="text"
            placeholder="대화 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-sidebar-accent rounded-md text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-sidebar-ring transition-shadow"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
        {/* Today */}
        {filterGroup(today).length > 0 && (
          <div>
            <p className="text-xs font-medium text-sidebar-foreground/40 px-2 py-1.5 uppercase tracking-wide">
              오늘
            </p>
            <div className="space-y-0.5">
              {filterGroup(today).map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => setActiveId(conv.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Yesterday */}
        {filterGroup(yesterday).length > 0 && (
          <div>
            <p className="text-xs font-medium text-sidebar-foreground/40 px-2 py-1.5 uppercase tracking-wide">
              어제
            </p>
            <div className="space-y-0.5">
              {filterGroup(yesterday).map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => setActiveId(conv.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Older */}
        {filterGroup(older).length > 0 && (
          <div>
            <p className="text-xs font-medium text-sidebar-foreground/40 px-2 py-1.5 uppercase tracking-wide">
              이전
            </p>
            <div className="space-y-0.5">
              {filterGroup(older).map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => setActiveId(conv.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shrink-0">
            U
          </div>
          <span className="text-sm font-medium text-sidebar-foreground flex-1 truncate">사용자</span>
          <MoreHorizontal className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: (typeof conversations)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium truncate">{conv.title}</span>
        <span className="text-xs text-sidebar-foreground/40 whitespace-nowrap mt-0.5">{conv.time}</span>
      </div>
      <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">{conv.preview}</p>
    </button>
  );
}
