import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle, TrendingUp, ArrowUpRight, Search } from "lucide-react";

const teamData = [
  { name: "Dewi Analis", done: 16, avg: "2.3 min", override: "4.2%", status: "online" },
  { name: "Adi Pratama", done: 12, avg: "3.1 min", override: "8.1%", status: "online" },
  { name: "Sari Wulan", done: 11, avg: "2.8 min", override: "3.9%", status: "online" },
  { name: "Rudi Hermawan", done: 5, avg: "4.2 min", override: "12.3%", status: "away" },
  { name: "Nova Putri", done: 3, avg: "5.1 min", override: "15.6%", status: "offline" },
];

export default function KepalaDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-[264px] bg-[var(--sidebar)] flex flex-col border-r border-[var(--sidebar-border)]">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--sidebar-border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="text-[#FEFCF4] font-['DM_Sans'] text-lg font-medium">MedNex</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-4 py-2 text-[10px] font-semibold tracking-[2px] text-[var(--sidebar-foreground)]">UTAMA</p>
          <button onClick={() => navigate("/kepala")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg bg-[var(--sidebar-accent)] text-[#FEFCF4] text-sm font-medium">
            <span className="text-[var(--primary)]">◆</span> Command Center
            <span className="ml-auto bg-[var(--primary)] text-white text-xs font-semibold px-2 py-0.5 rounded-full">3</span>
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            📤 Upload Klaim
          </button>
          <button onClick={() => navigate("/klaim")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            📁 Riwayat Klaim
          </button>
          <p className="px-4 py-2 mt-4 text-[10px] font-semibold tracking-[2px] text-[var(--sidebar-foreground)]">MANAJEMEN</p>
          <button onClick={() => navigate("/provider-tarif")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            🏥 Provider
          </button>
          <button onClick={() => navigate("/daftar-peserta")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            👥 Peserta
          </button>
        </nav>
        <div className="h-14 flex items-center gap-3 px-5 border-t border-[var(--sidebar-border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">PR</div>
          <div>
            <p className="text-[#FEFCF4] text-sm font-medium">Pak Rahman</p>
            <p className="text-[var(--sidebar-foreground)] text-xs">Kepala Klaim</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-7">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['DM_Sans'] text-2xl font-semibold text-[var(--foreground)]">Selamat pagi, Pak Rahman</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Selasa, 18 Maret 2026 · Tim: 5 analis aktif</p>
            </div>
            <div className="flex items-center gap-3 px-4 h-10 rounded-lg bg-white border border-[var(--border)]">
              <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">Cari analis...</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">ESKALASI MASUK</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-warning)] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning-foreground)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">3</p>
              <p className="text-xs text-[var(--color-warning-foreground)] mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +2 vs kemarin
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">TIM SELESAI HARI INI</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-success)] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success-foreground)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">47</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12 vs kemarin
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">KUALITAS TIM</span>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F5] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">94.2%</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Override rate: 5.8%</p>
            </div>
          </div>

          {/* Team Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['DM_Sans'] text-lg font-semibold text-[var(--foreground)]">Performa Tim</h2>
              <button onClick={() => navigate("/klaim")} className="text-sm text-[var(--primary)] font-medium hover:underline">Lihat Semua →</button>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-[var(--muted)] text-[10px] font-semibold tracking-[1px] text-[var(--muted-foreground)] font-mono uppercase">
                <span>Analis</span>
                <span>Selesai</span>
                <span>Rata-rata</span>
                <span>Override</span>
                <span>Status</span>
              </div>
              {teamData.map((row, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0 items-center">
                  <span className="text-sm font-medium text-[var(--foreground)]">{row.name}</span>
                  <span className="text-sm font-mono font-semibold text-[var(--foreground)]">{row.done}</span>
                  <span className="text-sm font-mono text-[var(--muted-foreground)]">{row.avg}</span>
                  <span className={`text-sm font-mono font-medium ${parseFloat(row.override) > 10 ? "text-[var(--color-warning-foreground)]" : "text-[var(--foreground)]"}`}>{row.override}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${row.status === "online" ? "bg-[var(--color-success-foreground)]" : row.status === "away" ? "bg-[var(--color-warning-foreground)]" : "bg-[var(--muted-foreground)]"}`} />
                    <span className="text-[var(--muted-foreground)] capitalize">{row.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
