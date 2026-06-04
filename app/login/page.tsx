"use client";

import { useState, useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        if (errorParam === "sso_failed") setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย SSO");
        else setError(`เกิดข้อผิดพลาด: ${errorParam}`);

        // Clean up URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ===== Traditional Login (ชั่วคราว — ไม่เรียก API) =====
  // บัญชีทดสอบ: athlete@up.ac.th / club@up.ac.th / staff@up.ac.th (password: 123456)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // บัญชีทดสอบ (hardcoded)
    const testAccounts: Record<string, { password: string; role: string }> = {
      "athlete@up.ac.th": { password: "Test@up2026", role: "athlete" },
      "club@up.ac.th": { password: "Test@up2026", role: "club" },
      "staff@up.ac.th": { password: "Test@up2026", role: "staff" },
    };

    // จำลองหน่วงเวลา
    await new Promise((r) => setTimeout(r, 500));

    const account = testAccounts[email];

    if (account && password === account.password) {
      const role = account.role;
      if (role === "athlete") window.location.href = "/athlete/register";
      else if (role === "club") window.location.href = "/club/athletes";
      else if (role === "staff") window.location.href = "/staff/applications";
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง (ทดสอบ: athlete@up.ac.th / Test@up2026)");
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setLoading(true);
    window.location.href = "/api/auth/sso";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">UP</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">ระบบลงทะเบียนนักกีฬา</h1>
          <p className="text-gray-500 text-sm mt-1">กีฬามหาวิทยาลัยแห่งประเทศไทย</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลมหาวิทยาลัย</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="xxxxxxxx@up.ac.th"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Domain Login)"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือ</span>
            </div>
          </div>

          <button
            onClick={handleSSOLogin}
            disabled={loading}
            type="button"
            className="mt-4 w-full bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
          >เข้าสู่ระบบด้วย SSO</button>
        </div>

        {/* Quick Access — เข้าถึงโดยไม่ต้อง Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">เข้าถึงโดยตรง</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <a
              href="/club/athletes"
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <span className="text-lg">🏟️</span>
              <span>Club</span>
            </a>
            <a
              href="/staff/applications"
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 text-sm font-medium transition-colors"
            >
              <span className="text-lg">👨‍💼</span>
              <span>Staff</span>
            </a>
            <a
              href="/athlete/register"
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border border-gray-300 hover:border-orange-400 hover:bg-orange-50 text-gray-700 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <span className="text-lg">🏃</span>
              <span>Athlete</span>
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          หากมีปัญหาการเข้าใช้งาน กรุณาติดต่องานกิจการนิสิต
        </p>
      </div>
    </div>
  );
}