import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

const openai = createOpenAI({ apiKey: process.env.OPEN_API_KEY });

export const maxDuration = 30;

const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? 500);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 1000);

export async function POST(req: NextRequest) {
    // 1. 쿠키에서 access_code 추출
    const code = req.cookies.get("access_code")?.value;
    if (!code) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 2. Supabase에서 코드 유효성 및 사용 횟수 확인
    const { data: accessCode, error: dbError } = await supabase
        .from("access_codes")
        .select("max_requests, used_requests, is_active")
        .eq("code", code)
        .single();

    if (dbError || !accessCode) {
        return NextResponse.json({ error: "유효하지 않은 접근입니다." }, { status: 401 });
    }
    if (!accessCode.is_active) {
        return NextResponse.json({ error: "접근이 비활성화되었습니다." }, { status: 403 });
    }
    if (accessCode.used_requests >= accessCode.max_requests) {
        return NextResponse.json(
            { error: `사용 한도(${accessCode.max_requests}회)를 모두 사용했습니다.` },
            { status: 429 }
        );
    }

    // 3. 요청 본문 파싱 + 입력 길이 검증
    const { messages }: { messages: UIMessage[] } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const inputText =
        lastMessage?.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") ?? "";

    if (inputText.length > MAX_INPUT_CHARS) {
        return NextResponse.json(
            { error: `입력은 ${MAX_INPUT_CHARS}자를 초과할 수 없습니다.` },
            { status: 400 }
        );
    }

    // 4. 요청 횟수 증가 (선불 차감)
    await supabase
        .from("access_codes")
        .update({
            used_requests: accessCode.used_requests + 1,
            // updated_at 없으므로 별도 timestamp 불필요
        })
        .eq("code", code);

    // 5. AI 응답 스트리밍
    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: "당신은 NEXINOUS의 AI 어시스턴트입니다. 친절하고 명확하게 한국어로 답변해 주세요.",
        messages: await convertToModelMessages(messages),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    return result.toUIMessageStreamResponse();
}
