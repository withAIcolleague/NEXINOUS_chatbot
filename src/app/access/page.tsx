"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "인증에 실패했습니다.");
                return;
            }

            // 인증 성공 → 홈으로 이동
            router.push("/");
            router.refresh();
        } catch {
            setError("서버 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sidebar-primary mb-4">
                        <span className="text-2xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">NEXINOUS</h1>
                    <p className="text-sm text-neutral-500 mt-1">테스트 접근 코드를 입력해주세요</p>
                </div>

                {/* 입력 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="초대 코드 입력 (예: NEXIN-A3X9)"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800
                         text-white placeholder-neutral-600 text-center text-lg tracking-widest
                         focus:outline-none focus:border-neutral-600 transition-colors"
                            maxLength={20}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !code.trim()}
                        className="w-full py-3 rounded-xl bg-sidebar-primary text-white font-semibold
                       hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-opacity"
                    >
                        {isLoading ? "확인 중..." : "입장하기"}
                    </button>
                </form>

                <p className="text-xs text-neutral-700 text-center mt-6">
                    코드가 없으시면 관리자에게 문의해주세요.
                </p>
            </div>
        </div>
    );
}
