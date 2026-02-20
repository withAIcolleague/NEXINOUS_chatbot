import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";

const openai = createOpenAI({
    apiKey: process.env.OPEN_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: openai("gpt-5-mini"),
        system:
            "당신은 NEXINOUS의 AI 어시스턴트입니다. 친절하고 명확하게 한국어로 답변해 주세요.",
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}
