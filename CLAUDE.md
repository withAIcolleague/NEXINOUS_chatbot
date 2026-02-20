# NEXINOUS Chatbot — 개발 참고 메모

## 프로젝트 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui |
| AI SDK | `ai@6.x`, `@ai-sdk/react@3.x`, `@ai-sdk/openai` |
| AI 모델 | OpenAI `gpt-5-mini` |

---

## 환경변수

`.env.local`:
```
OPEN_API_KEY=sk-...
```

> ⚠️ 키 이름이 `OPENAI_API_KEY`가 아닌 **`OPEN_API_KEY`** 임.  
> `createOpenAI({ apiKey: process.env.OPEN_API_KEY })` 로 명시 전달 필요.

---

## AI SDK v6 핵심 패턴

### 패키지 설치 시 주의

> ⚠️ 이 프로젝트는 **React 19** 사용으로 인해 대부분의 패키지 설치 시 피어 의존성 충돌 발생.  
> **항상 `--legacy-peer-deps` 플래그 필수.**

```bash
# 예시
npm install <패키지명> --legacy-peer-deps
```

초기 설치 목록:
```bash
npm install ai @ai-sdk/react @ai-sdk/openai zod @supabase/supabase-js --legacy-peer-deps
```

---

### route.ts (API Route)

```ts
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";

const openai = createOpenAI({ apiKey: process.env.OPEN_API_KEY });
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: "시스템 프롬프트...",
    messages: await convertToModelMessages(messages), // ← await 필수!
  });

  return result.toUIMessageStreamResponse(); // UI Message Stream 방식
}
```

> ⚠️ `convertToModelMessages`는 **async 함수** → `await` 없으면 500 에러  
> ⚠️ `body.messages`는 `UIMessage[]` 타입 (parts 배열 기반), 그대로 streamText에 넘기면 안 됨

---

### ChatArea.tsx (프론트엔드)

```tsx
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: "/api/chat" }), // transport 명시 필수
});

// 메시지 전송
sendMessage({ text: input }); // ← { text } 형식 필수 (content 아님!)

// 로딩 상태
const isLoading = status === "streaming" || status === "submitted";
const isReady = status === "ready";

// 메시지 렌더링 — parts 배열 기반
{msg.parts.map((part, i) =>
  part.type === "text" ? <span key={i}>{part.text}</span> : null
)}
```

---

## v4 → v6 API 변경 핵심 비교

| 항목 | v4 (구버전) | v6 (현재) |
|---|---|---|
| transport 설정 | `useChat({ api: '/api/chat' })` | `useChat({ transport: new DefaultChatTransport({ api }) })` |
| 메시지 전송 | `handleSubmit(e)` | `sendMessage({ text: input })` |
| 입력값 관리 | `input`, `handleInputChange` (훅 제공) | 직접 `useState`로 관리 |
| 로딩 상태 | `isLoading` | `status === 'streaming' \| 'submitted'` |
| 메시지 내용 | `msg.content` (string) | `msg.parts` (배열) |
| route 응답 | `toDataStreamResponse()` | `toUIMessageStreamResponse()` |

---

## Text Stream vs UI Message Stream

| | Text Stream | UI Message Stream |
|---|---|---|
| Transport | `TextStreamChatTransport` | `DefaultChatTransport` |
| route 응답 | `toTextStreamResponse()` | `toUIMessageStreamResponse()` |
| 툴콜/usage 지원 | ❌ | ✅ |
| **현재 사용** | | ✅ |

---

## 주요 파일 구조

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                        ← OpenAI 스트리밍 엔드포인트
│   │   └── conversations/
│   │       ├── route.ts                         ← GET/POST 대화 목록 API
│   │       └── [id]/messages/route.ts           ← POST 메시지 저장 API
│   ├── layout.tsx                               ← Toaster 포함
│   └── page.tsx                                 ← Sidebar + ChatArea 레이아웃
├── components/
│   ├── ChatArea.tsx                             ← 채팅 UI, 조건부 렌더링, 새 대화 생성
│   └── Sidebar.tsx                              ← 동적 대화 목록, router 연동
└── lib/
    ├── supabase-client.ts                       ← Supabase 클라이언트 (실체)
    └── supabase.ts                              ← re-export (하위 호환)
```

---

## Supabase 연동 패턴

### 클라이언트 초기화 (`src/lib/supabase-client.ts`)

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

환경변수 (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### DB 스키마 (`src/schema.sql`)

```sql
conversations (id, title, created_at)
messages      (id, conversation_id FK, role, content, created_at)
-- role CHECK: 'user' | 'assistant' | 'system'
```

### API Route 패턴

```ts
// GET /api/conversations — 목록 조회
const { data, error } = await supabase
  .from("conversations").select("id, title").order("created_at", { ascending: false });

// POST /api/conversations — 새 대화 생성
const { data, error } = await supabase
  .from("conversations").insert({ title }).select().single();

// POST /api/conversations/[id]/messages — 메시지 저장
const { data, error } = await supabase
  .from("messages")
  .insert({ conversation_id: Number(id), role, content })
  .select().single();
```

---

## ChatArea 조건부 렌더링 패턴

```tsx
// URL ?id= 파라미터 → useState로 관리
const searchParams = useSearchParams();
const [conversationId, setConversationId] = useState<string | null>(
  searchParams.get("id")
);
useEffect(() => {
  setConversationId(searchParams.get("id"));
}, [searchParams]);

// 렌더링 분기
{!conversationId ? (
  <초기화면 />  // 안내 문구 + 새 대화 시작하기 버튼
) : (
  <채팅UI />   // 메시지 목록 + 입력창
)}
```

---

## Sidebar 네비게이션 패턴

```tsx
import { useRouter } from "next/navigation";
const router = useRouter();

// 대화 항목 클릭
onClick={() => {
  setActiveId(conv.id);
  router.push(`/?id=${conv.id}`);  // 절대 경로 사용
}}
```

---

## Git / GitHub 워크플로우

**Remote:** `https://github.com/withAIcolleague/NEXINOUS_chatbot.git`  
**브랜치:** `main`

### push 방법 (PowerShell)

> ⚠️ PowerShell에서 `&&` 연산자 미지원 → `;` 사용  
> ⚠️ 커밋 메시지에 한글·공백 포함 시 `-m` 대신 `-F` 파일 방식 권장

```powershell
git add -A
git commit -m "feat: 변경 내용"
git push
```

### 커밋 히스토리

| 날짜 | 커밋 해시 | 내용 |
|---|---|---|
| 2026-02-20 | `0a0da20` | feat: add AI SDK v6 streaming and Supabase integration |
| 2026-02-20 | `eaae882` | feat: Supabase integration, conversation & message API, Sidebar/ChatArea improvements |

---

## TODO / 미구현 기능

- [ ] 대화 선택 시 기존 메시지 불러오기 (`GET /api/conversations/[id]/messages`)
- [ ] 채팅 메시지 Supabase 저장 연동 (현재 AI 응답이 DB에 저장되지 않음)
- [ ] Sidebar 대화 목록 — 새 대화 생성 후 자동 갱신
- [ ] 마크다운 렌더링 (현재 plain text)
- [ ] 에러 바운더리 및 로딩 UX 개선
