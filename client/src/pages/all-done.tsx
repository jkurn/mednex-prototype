import { useLocation, Link } from "wouter";
import {
  Check,
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  Settings,
  ArrowLeft,
  Zap,
} from "lucide-react";

/* ──────────────────────── Sidebar (charcoal) ──────────────────────── */

function CharcoalSidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Command Center", icon: LayoutDashboard, path: "/dashboard", id: "command-center" },
    { label: "Klaim", icon: FileText, path: "/klaim", id: "klaim" },
    { label: "Polis & Peserta", icon: Users, path: "/pemegang-polis", id: "polis" },
    { label: "Provider & Tarif", icon: BookOpen, path: "/provider-tarif", id: "provider" },
    { label: "Pengaturan", icon: Settings, path: "/settings/user", id: "settings" },
  ];

  return (
    <div
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 264, backgroundColor: "#2D2926" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#0A8637" }}
          >
            M
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-tight">
              MedNex
            </span>
            <span className="ml-1.5 text-[10px] bg-white/15 text-white/70 px-1.5 py-0.5 rounded">
              Demo
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === "command-center";
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-medium">
            DA
          </div>
          <div>
            <p className="text-white text-[13px] font-medium leading-tight">
              Dewi Analis
            </p>
            <p className="text-white/50 text-[11px]">Analis Klaim</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Keyboard shortcut badge ──────────────────── */

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold"
      style={{
        backgroundColor: "#F5F4F1",
        color: "#3A3632",
        border: "1px solid #E8E6E1",
      }}
    >
      {children}
    </kbd>
  );
}

/* ──────────────────────── Main page ──────────────────────────────── */

export default function AllDonePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF8" }}>
      <CharcoalSidebar />

      {/* Content area */}
      <div className="flex items-center justify-center min-h-screen" style={{ marginLeft: 264 }}>
        <div className="flex flex-col items-center w-full max-w-md px-6 py-12">

          {/* ── Green checkmark circle ── */}
          <div
            className="flex items-center justify-center rounded-full mb-6"
            style={{
              width: 60,
              height: 60,
              backgroundColor: "#DAFDD7",
            }}
          >
            <Check style={{ color: "#0A8637" }} className="w-7 h-7" strokeWidth={3} />
          </div>

          {/* ── Heading ── */}
          <h1
            className="font-bold mb-2 text-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 32,
              color: "#3A3632",
            }}
          >
            Semua selesai!
          </h1>

          {/* ── Subtitle ── */}
          <p
            className="text-center mb-1"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: "#97958E",
            }}
          >
            Anda sudah review 23 klaim hari ini
          </p>

          {/* ── Stats line ── */}
          <p
            className="text-center mb-8"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: "#97958E",
            }}
          >
            12 klaim full AI &mdash;{" "}
            <a
              href="#"
              className="underline"
              style={{ color: "#C2700A" }}
              onClick={(e) => e.preventDefault()}
            >
              1 tolak diblokir
            </a>
          </p>

          {/* ── Savings card ── */}
          <div
            className="w-full rounded-xl p-6 mb-4"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E6E1",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#DAFDD7" }}
              >
                <Check style={{ color: "#0A8637" }} className="w-3 h-3" strokeWidth={3} />
              </div>
              <span
                className="font-bold"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 18,
                  color: "#3A3632",
                }}
              >
                Rp 12.4M dihemat
              </span>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 14, color: "#97958E" }}>Overpricing</span>
                <span
                  className="font-semibold"
                  style={{ fontSize: 14, color: "#3A3632" }}
                >
                  Rp 8.2M
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 14, color: "#97958E" }}>Fraud dicegah</span>
                <span
                  className="font-semibold"
                  style={{ fontSize: 14, color: "#3A3632" }}
                >
                  Rp 4.2M
                </span>
              </div>
            </div>
          </div>

          {/* ── Keyboard shortcuts card ── */}
          <div
            className="w-full rounded-xl p-6 mb-6"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E6E1",
            }}
          >
            <h3
              className="font-semibold mb-4"
              style={{ fontSize: 14, color: "#3A3632" }}
            >
              Keyboard Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Kbd>J</Kbd>
                <span className="text-[13px]" style={{ color: "#6B6964" }}>/</span>
                <Kbd>K</Kbd>
                <span className="text-[13px] ml-1" style={{ color: "#97958E" }}>
                  Navigate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>A</Kbd>
                <span className="text-[13px] ml-1" style={{ color: "#97958E" }}>
                  Approve
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>R</Kbd>
                <span className="text-[13px] ml-1" style={{ color: "#97958E" }}>
                  Reject
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>E</Kbd>
                <span className="text-[13px] ml-1" style={{ color: "#97958E" }}>
                  Escalate
                </span>
              </div>
            </div>
          </div>

          {/* ── Green success banner ── */}
          <div
            className="w-full rounded-lg px-4 py-3 mb-6 flex items-center gap-2"
            style={{
              backgroundColor: "#DAFDD7",
              border: "1px solid #B0F0A8",
            }}
          >
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#0A8637" }} />
            <span
              className="text-[13px] font-medium"
              style={{ color: "#0A8637" }}
            >
              Anda 15% lebih cepat dari rata-rata tim hari ini
            </span>
          </div>

          {/* ── Back to Dashboard button ── */}
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            style={{
              color: "#3A3632",
              border: "1px solid #D4D2CD",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
