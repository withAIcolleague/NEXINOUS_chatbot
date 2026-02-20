import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

// POST /api/conversations/[id]/messages — 메시지 저장
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. URL에서 대화 id 추출
    const { id } = await params;

    // 2. request body 파싱 — role, content 추출
    const { role, content } = await request.json();

    // 3. Supabase messages 테이블에 저장
    const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: Number(id), role, content })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
