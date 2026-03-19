import { useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Ensure scroll to top on fresh login
      window.scrollTo(0, 0);
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Pane — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-10"
        style={{
          width: 560,
          minWidth: 560,
          backgroundColor: "var(--sand-100)",
        }}
      >
        {/* Top: Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--orange-600)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FEFCF4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span
              className="text-xl font-semibold"
              style={{ color: "#FEFCF4", fontFamily: "var(--font-display)" }}
            >
              MedNex
            </span>
          </div>

          {/* Pill badge */}
          <div
            className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-8"
            style={{
              backgroundColor: "var(--sand-200)",
              color: "var(--orange-600)",
              border: "1px solid var(--sand-300)",
            }}
          >
            AI-Powered Claims Intelligence
          </div>

          {/* Headline */}
          <h1
            className="text-display-s lg:text-display-m font-bold leading-tight mb-6"
            style={{
              color: "#FEFCF4",
              fontFamily: "var(--font-display)",
            }}
          >
            Stop reviewing 2% of claims.
            <br />
            Start reviewing all of them.
          </h1>

          {/* Subtitle */}
          <p
            className="text-body-l leading-relaxed"
            style={{ color: "var(--sand-600)", maxWidth: 440 }}
          >
            MedNex analyzes every health insurance claim for fraud, waste, and
            overpricing — automatically, in seconds.
          </p>
        </div>

        {/* Footer */}
        <p className="text-body-s" style={{ color: "var(--sand-500)" }}>
          &copy; 2026 Strator AI
        </p>
      </div>

      {/* Right Pane — Login Form */}
      <div
        className="flex-1 flex items-center justify-center px-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <LoginForm />
      </div>
    </div>
  );
}
