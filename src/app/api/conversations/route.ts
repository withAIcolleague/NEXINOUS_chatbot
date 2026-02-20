import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

// GET /api/conversations — 대화 목록 조회
export async function GET() {
    const { data, error } = await supabase
        .from("conversations")
        .select("id, title")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/conversations — 새 대화 생성
export async function POST(req: Request) {
    const { title } = await req.json();

    const { data, error } = await supabase
        .from("conversations")
        .insert({ title })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
