import { NextRequest, NextResponse } from "next/server";

// 403 차단 시 보여줄 HTML 페이지
const BLOCKED_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>접근 불가</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #0f0f0f; color: #fff; }
    .box { text-align: center; }
    h1 { font-size: 3rem; margin-bottom: 0.5rem; }
    p  { color: #888; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🚫 403</h1>
    <p>현재 테스트 기간으로 허가된 IP만 접속할 수 있습니다.</p>
  </div>
</body>
</html>`;

function getAllowedIPs(): string[] {
    const raw = process.env.ALLOWED_IPS ?? "";
    // 로컬호스트는 항상 허용
    const defaults = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
    const fromEnv = raw
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean);
    return [...new Set([...defaults, ...fromEnv])];
}

function getClientIP(req: NextRequest): string {
    // Vercel / 프록시 환경에서는 x-forwarded-for 헤더 사용
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}

export function middleware(req: NextRequest) {
    const ip = getClientIP(req);
    const allowed = getAllowedIPs();

    if (!allowed.includes(ip)) {
        console.warn(`[IP Block] 차단된 접속 시도 — IP: ${ip}, URL: ${req.url}`);

        // API 요청은 JSON으로, 페이지 요청은 HTML로 응답
        const isApiRequest = req.nextUrl.pathname.startsWith("/api/");
        if (isApiRequest) {
            return NextResponse.json(
                { error: "접근이 거부되었습니다." },
                { status: 403 }
            );
        }

        return new NextResponse(BLOCKED_HTML, {
            status: 403,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    return NextResponse.next();
}

// 정적 파일·Next.js 내부 경로 제외하고 모든 요청에 적용
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
