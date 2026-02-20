import { NextRequest, NextResponse } from "next/server";

// 인증이 필요 없는 경로
const PUBLIC_PATHS = ["/access", "/api/verify-code"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 정적 리소스 및 공개 경로 통과
    const isPublic =
        PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

    if (isPublic) return NextResponse.next();

    // access_code 쿠키 확인
    const code = req.cookies.get("access_code")?.value;
    if (!code) {
        // 쿠키 없음 → 코드 입력 페이지로 리다이렉트
        const url = req.nextUrl.clone();
        url.pathname = "/access";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
