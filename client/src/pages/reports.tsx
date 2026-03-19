import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { TrendingUp, TrendingDown, ChevronDown, FileDown, Clock, BarChart3, ShieldAlert, FileCheck } from "lucide-react";

const savingsData = [
  { month: "Okt", value: 45 },
  { month: "Nov", value: 62 },
  { month: "Des", value: 58 },
  { month: "Jan", value: 78 },
  { month: "Feb", value: 89 },
  { month: "Mar", value: 127 },
];

const rejectionReasons = [
  { label: "Peserta tidak aktif", pct: 35 },
  { label: "Overpricing", pct: 28 },
  { label: "Dokumen tidak lengkap", pct: 22 },
  { label: "Provider tidak terdaftar", pct: 15 },
];

const topProviders = [
  { name: "RS Medistra", count: 12 },
  { name: "RS Pondok Indah", count: 8 },
  { name: "Klinik Prima", count: 6 },
  { name: "RS Premier", count: 4 },
  { name: "RS Siloam", count: 3 },
];

const maxSavings = Math.max(...savingsData.map((d) => d.value));

export default function Reports() {
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
          <button onClick={() => navigate("/kepala")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg text-[var(--sidebar-foreground)] text-sm hover:bg-[var(--sidebar-accent)] transition">
            <span className="text-[var(--primary)]">◆</span> Command Center
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
          <button onClick={() => navigate("/laporan")} className="w-full flex items-center gap-3 px-4 h-10 rounded-lg bg-[var(--sidebar-accent)] text-[#FEFCF4] text-sm font-medium">
            📊 Laporan
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['DM_Sans'] text-2xl font-semibold text-[var(--foreground)]">Laporan & Analitik</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Maret 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white border border-[var(--border)] text-sm text-[var(--foreground)]">
                Periode: 30 Hari
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
              <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium">
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">TOTAL PENGHEMATAN</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-success)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success-foreground)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">Rp 127M</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18%
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">KLAIM DIPROSES</span>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F5] flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">342</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12%
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">AI OVERRIDE RATE</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-warning)] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-[var(--color-warning-foreground)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">5.8%</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -1.2%
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">RATA-RATA WAKTU</span>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F5] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-[var(--foreground)]">2.4 min</p>
              <p className="text-xs text-[var(--color-success-foreground)] mt-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -0.3 min
              </p>
            </div>
          </div>

          {/* Two Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Bar Chart */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">TREN PENGHEMATAN BULANAN</span>
                <BarChart3 className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
              <div className="flex items-end justify-between gap-3 h-[200px]">
                {savingsData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-mono font-semibold text-[var(--foreground)] mb-2">{d.value}M</span>
                    <div
                      className="w-full rounded-t-md bg-[var(--primary)]"
                      style={{ height: `${(d.value / maxSavings) * 160}px` }}
                    />
                    <span className="text-xs text-[var(--muted-foreground)] mt-2 font-mono">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stacked Cards */}
            <div className="space-y-4">
              {/* Rejection Reasons */}
              <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">ALASAN PENOLAKAN</span>
                <div className="mt-4 space-y-3">
                  {rejectionReasons.map((r) => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--foreground)]">{r.label}</span>
                        <span className="text-sm font-mono font-semibold text-[var(--foreground)]">{r.pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--muted)]">
                        <div
                          className="h-2 rounded-full bg-[var(--primary)]"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Providers */}
              <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] font-mono">TOP 5 PROVIDER BERMASALAH</span>
                <div className="mt-4 space-y-2.5">
                  {topProviders.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-mono font-semibold text-[var(--muted-foreground)]">{i + 1}</span>
                      <span className="flex-1 text-sm text-[var(--foreground)]">{p.name}</span>
                      <span className="text-sm font-mono font-semibold text-[var(--foreground)]">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
