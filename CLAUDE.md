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
│   ├── api/chat/route.ts   ← OpenAI 스트리밍 API 엔드포인트
│   ├── layout.tsx
│   └── page.tsx            ← Sidebar + ChatArea 레이아웃
└── components/
    ├── ChatArea.tsx         ← 채팅 UI + useChat 훅
    └── Sidebar.tsx          ← 대화 목록 (현재 정적 데이터)
```

---

## TODO / 미구현 기능

- [ ] Sidebar ↔ ChatArea 대화 상태 연동 (현재 사이드바는 더미 데이터)
- [ ] 새 대화 생성 버튼 기능
- [ ] 대화 기록 저장 (localStorage 또는 DB)
- [ ] 마크다운 렌더링 (현재 plain text)
