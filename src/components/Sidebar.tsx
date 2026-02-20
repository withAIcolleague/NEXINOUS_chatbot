"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Search, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type Conversation = {
  id: number;
  title: string;
};

export default function Sidebar() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(`대화 목록을 불러오지 못했습니다: ${error}`);
        return;
      }
      const data: Conversation[] = await res.json();
      setConversations(data);
    } catch {
      toast.error("서버에 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const newConv: Conversation = await res.json();
      // 목록 전체 갱신
      await fetchConversations();
      setActiveId(newConv.id);
      toast.success("새 대화가 시작되었습니다.");
    } catch {
      toast.error("대화 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">AI Chat</span>
        </div>
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="새 대화 시작하기"
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
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-1 px-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-md bg-sidebar-accent/60 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-sidebar-foreground/40 text-center py-8">
            {searchQuery ? "검색 결과가 없습니다." : "대화가 없습니다."}
          </p>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={activeId === conv.id}
              onClick={() => {
                setActiveId(conv.id);
                router.push(`/?id=${conv.id}`);
              }}
            />
          ))
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shrink-0">
            U
          </div>
          <span className="text-sm font-medium text-sidebar-foreground flex-1 truncate">
            사용자
          </span>
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
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
        }`}
    >
      <span className="text-sm font-medium truncate block">{conv.title}</span>
    </button>
  );
}
