import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function POST(req: NextRequest) {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
        return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
    }

    // Supabase에서 코드 조회
    const { data, error } = await supabase
        .from("access_codes")
        .select("code, label, max_requests, used_requests, is_active")
        .eq("code", code.trim().toUpperCase())
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "유효하지 않은 코드입니다." }, { status: 401 });
    }

    if (!data.is_active) {
        return NextResponse.json({ error: "비활성화된 코드입니다." }, { status: 403 });
    }

    if (data.used_requests >= data.max_requests) {
        return NextResponse.json(
            { error: `사용 한도(${data.max_requests}회)를 초과했습니다.` },
            { status: 429 }
        );
    }

    // 인증 성공 → httpOnly 쿠키 설정
    const res = NextResponse.json({
        ok: true,
        label: data.label,
        remaining: data.max_requests - data.used_requests,
    });

    res.cookies.set("access_code", data.code, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
    });

    return res;
}
