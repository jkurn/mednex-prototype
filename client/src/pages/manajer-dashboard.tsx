import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { BarChart3, FileText, Building2, Shield, Users, AlertTriangle, TrendingDown, TrendingUp, ArrowDownRight } from "lucide-react";

const savingsData = [
  { month: "Okt", value: 45 },
  { month: "Nov", value: 62 },
  { month: "Des", value: 58 },
  { month: "Jan", value: 78 },
  { month: "Feb", value: 89 },
  { month: "Mar", value: 127 },
];

const riskyProviders = [
  { name: "RS Harapan Medika", score: 87, claims: 48, flag: "Upcoding berulang" },
  { name: "Klinik Sejahtera Plus", score: 74, claims: 31, flag: "Tarif di atas standar" },
  { name: "RS Budi Asih", score: 69, claims: 22, flag: "Duplikasi prosedur" },
  { name: "Lab Prima Diagnostik", score: 61, claims: 15, flag: "Unbundling test" },
];

const maxSavings = Math.max(...savingsData.map((d) => d.value));

export default function ManajerDashboard() {
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
          <button onClick={() => navigate("/manajer")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg bg-[var(--sidebar-accent)] text-[#FEFCF4] text-sm font-medium">
            <BarChart3 className="w-4 h-4 text-[var(--primary)]" /> Command Center
          </button>
          <button onClick={() => navigate("/reports")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            <FileText className="w-4 h-4" /> Laporan
          </button>
          <p className="px-4 py-2 mt-4 text-[10px] font-semibold tracking-[2px] text-[var(--sidebar-foreground)]">MANAJEMEN</p>
          <button onClick={() => navigate("/provider-tarif")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            <Building2 className="w-4 h-4" /> Provider
          </button>
          <button onClick={() => navigate("/pemegang-polis")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            <Shield className="w-4 h-4" /> Polis
          </button>
          <button onClick={() => navigate("/daftar-peserta")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            <Users className="w-4 h-4" /> Peserta
          </button>
        </nav>
        <div className="h-14 flex items-center gap-3 px-5 border-t border-[var(--sidebar-border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">IK</div>
          <div>
            <p className="text-[#FEFCF4] text-sm font-medium">Ibu Kartini</p>
            <p className="text-[var(--sidebar-foreground)] text-xs">Manajer Klaim</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-7">
          {/* Header */}
          <div>
            <h1 className="font-['DM_Sans'] text-2xl font-semibold text-[var(--foreground)]">Selamat pagi, Ibu Kartini</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Selasa, 18 Maret 2026</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* HERO card */}
            <div className="bg-[var(--primary)] rounded-xl p-6">
              <span className="text-[10px] font-semibold tracking-[2px] text-white/70 font-mono">TOTAL PENGHEMATAN</span>
              <p className="text-3xl font-bold font-mono text-white mt-3">Rp 127M</p>
              <p className="text-xs text-white/70 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Bulan Maret 2026
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">KLAIM BULAN INI</span>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">342</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% vs bulan lalu
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">LOSS RATIO</span>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">68.4%</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> -2.1% vs bulan lalu
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">PROVIDER BERISIKO</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-error)] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-error-foreground)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">4</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">dari 23 provider</p>
            </div>
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Savings Trend */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['DM_Sans'] text-lg font-semibold text-[var(--foreground)]">Tren Penghematan</h2>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">6 bulan terakhir</span>
              </div>
              <div className="flex items-end gap-3 h-[180px]">
                {savingsData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold text-[var(--muted-foreground)]">{d.value}M</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        i === savingsData.length - 1
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--primary)]/20"
                      }`}
                      style={{ height: `${(d.value / maxSavings) * 140}px` }}
                    />
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Top Risky Providers */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['DM_Sans'] text-lg font-semibold text-[var(--foreground)]">Top Provider Berisiko</h2>
                <button onClick={() => navigate("/provider-tarif")} className="text-sm text-[var(--primary)] font-medium hover:underline">Lihat Semua →</button>
              </div>
              <div className="space-y-4">
                {riskyProviders.map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{p.name}</span>
                        <span className={`text-sm font-mono font-bold ${
                          p.score >= 80
                            ? "text-[var(--color-error-foreground)]"
                            : p.score >= 70
                            ? "text-[var(--color-warning-foreground)]"
                            : "text-[var(--foreground)]"
                        }`}>
                          {p.score}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--muted)]">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            p.score >= 80
                              ? "bg-[var(--color-error)]"
                              : p.score >= 70
                              ? "bg-[var(--color-warning)]"
                              : "bg-[var(--primary)]"
                          }`}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-1 font-mono">{p.flag} · {p.claims} klaim</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
