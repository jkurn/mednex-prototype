import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";

const feedData = [
  { id: "Claim_047", status: "approved", time: "14:32:07", file: "Claim_047_RS_Harapan.pdf", amount: "Rp 3.2M" },
  { id: "Claim_046", status: "review", time: "14:31:54", file: "Claim_046_Klinik_Sehat.pdf", amount: "Rp 14.7M" },
  { id: "Claim_045", status: "approved", time: "14:31:41", file: "Claim_045_RS_Medika.pdf", amount: "Rp 1.8M" },
  { id: "Claim_044", status: "rejected", time: "14:31:28", file: "Claim_044_RS_Sentosa.pdf", amount: "Rp 8.1M" },
  { id: "Claim_043", status: "approved", time: "14:31:15", file: "Claim_043_RS_Bunda.pdf", amount: "Rp 5.4M" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle className="h-5 w-5" style={{ color: "var(--color-success)" }} />;
  if (status === "review") return <AlertCircle className="h-5 w-5" style={{ color: "var(--color-warning)" }} />;
  return <XCircle className="h-5 w-5" style={{ color: "var(--color-error)" }} />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: "var(--color-success)", color: "var(--color-success-foreground)" }}
      >
        Approve
      </span>
    );
  }
  if (status === "review") {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: "var(--color-warning)", color: "var(--color-warning-foreground)" }}
      >
        Review
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-foreground)" }}
    >
      Ditolak
    </span>
  );
}

export default function ProcessingFeed() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Top Bar */}
      <div
        className="h-14 flex items-center justify-between px-6 border-b bg-white"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          MedNex
        </span>
        <button
          onClick={() => setLocation("/dashboard")}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>

      {/* Centered Header */}
      <div className="flex flex-col items-center pt-10 pb-8 px-4">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ backgroundColor: "rgb(255, 237, 213)", color: "rgb(194, 120, 3)" }}
        >
          Batch Processing
        </span>
        <h1
          className="text-[32px] font-bold mb-2"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--foreground)" }}
        >
          Memproses 24 Klaim
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          12 dari 24 selesai — est. 2 menit lagi
        </p>
        <div
          className="w-full max-w-[640px] h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--muted)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: "50%", backgroundColor: "var(--primary)" }}
          />
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-6xl mx-auto px-6 pb-12 flex gap-6" style={{ alignItems: "flex-start" }}>
        {/* LEFT: Live Feed */}
        <div
          className="flex-1 rounded-lg border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span
              className="text-xs font-semibold tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              LIVE FEED
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {feedData.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <StatusIcon status={item.status} />
                <span
                  className="text-xs font-mono shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {item.time}
                </span>
                <span
                  className="text-sm truncate flex-1"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.file}
                </span>
                <StatusBadge status={item.status} />
                <span
                  className="text-sm font-mono font-bold shrink-0 w-20 text-right"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Stats Cards */}
        <div className="w-[360px] shrink-0 flex flex-col gap-4">
          {/* Total Diproses */}
          <div
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <span
              className="text-xs font-semibold tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              TOTAL DIPROSES
            </span>
            <p
              className="text-[28px] font-mono font-bold mt-2"
              style={{ color: "var(--foreground)" }}
            >
              Rp 187.4M
            </p>
          </div>

          {/* Hero: Potensi Penghematan */}
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <span
              className="text-xs font-semibold tracking-wider"
              style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
            >
              POTENSI PENGHEMATAN
            </span>
            <p
              className="text-[28px] font-mono font-bold mt-2"
              style={{ color: "var(--primary-foreground)" }}
            >
              Rp 23.1M
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
            >
              12.3% dari total
            </p>
          </div>

          {/* Distribusi */}
          <div
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <span
              className="text-xs font-semibold tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              DISTRIBUSI
            </span>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-success)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>
                    Auto-approved
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  8
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-warning)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>
                    Perlu review
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  3
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-error)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>
                    Ditolak
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
