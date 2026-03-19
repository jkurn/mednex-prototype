import { useEffect, useMemo } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useClaimsData } from "@/hooks/useClaimsData";
import { useSettingsModal } from "@/hooks/useSettingsModal";

import DashboardMenuBoxes from "@/components/dashboard/DashboardMenuBoxes";
import ClaimsBarChart from "@/components/dashboard/ClaimsBarChart";
import ClaimsActivityFeed from "@/components/dashboard/ClaimsActivityFeed";
import LoadingOverlay from "@/components/dashboard/LoadingOverlay";
import AdminSettings from "@/pages/admin-settings";

import {
  LayoutDashboard,
  Upload,
  History,
  Building2,
  Users,
  BookOpen,
  Settings,
  Search,
  Upload as UploadIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { claims, addClaim, refreshData } = useClaimsData();
  const [location, setLocation] = useLocation();
  const [matchAdmin] = useRoute("/settings/admin");
  const { openSettings } = useSettingsModal();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Restore scroll position when returning to dashboard, or scroll to top for fresh login
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('dashboardScrollPosition');
    if (savedScrollPosition) {
      const scrollPos = parseInt(savedScrollPosition, 10);
      const attemptScroll = () => {
        window.scrollTo(0, scrollPos);
        if (window.scrollY < scrollPos - 50) {
          requestAnimationFrame(attemptScroll);
        }
      };
      requestAnimationFrame(attemptScroll);
    } else {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  }, []);

  // Compute stat card metrics
  const stats = useMemo(() => {
    const pending = claims.filter(c => !c.adjudicationResult).length;
    const total = claims.length;
    const completed = claims.filter(c => !!c.adjudicationResult).length;
    // Estimate savings from rejected/partial claims
    const savings = claims.reduce((sum, c) => {
      const amount = c.amount || 0;
      const decision = c.reviewDecision?.finalDecision;
      if (decision === 'TOLAK') return sum + amount;
      if (decision === 'SETUJUI PARTIAL') return sum + Math.round(amount * 0.3);
      return sum;
    }, 0);
    return { pending, total, completed, savings };
  }, [claims]);

  // Format currency
  const formatRupiah = (value: number) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
    return `Rp ${value}`;
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const firstName = user?.name?.split(" ")[0] || "Dewi";

  if (!isAuthenticated) {
    return null;
  }

  // Nav items configuration
  const navSections = [
    {
      label: "UTAMA",
      items: [
        {
          id: "command-center",
          label: "Command Center",
          icon: LayoutDashboard,
          path: "/dashboard",
          badge: stats.pending > 0 ? stats.pending : null,
        },
        {
          id: "upload-klaim",
          label: "Upload Klaim",
          icon: Upload,
          path: "/upload",
        },
        {
          id: "riwayat-klaim",
          label: "Riwayat Klaim",
          icon: History,
          path: "/riwayat",
        },
      ],
    },
    {
      label: "MANAJEMEN",
      items: [
        {
          id: "provider",
          label: "Provider",
          icon: Building2,
          path: "/provider-tarif",
        },
        {
          id: "peserta",
          label: "Peserta",
          icon: Users,
          path: "/pemegang-polis",
        },
        {
          id: "tarif-book",
          label: "Tarif Book",
          icon: BookOpen,
          path: "/tarif-book",
        },
      ],
    },
  ];

  // Stat cards config
  const statCards = [
    {
      label: "KLAIM TERTUNDA",
      value: String(stats.pending),
      trend: stats.pending > 0 ? `${stats.pending} butuh review` : "Semua selesai",
      trendUp: false,
      style: "warning" as const,
    },
    {
      label: "TOTAL HARI INI",
      value: String(stats.total),
      trend: "klaim masuk",
      trendUp: true,
      style: "default" as const,
    },
    {
      label: "SELESAI",
      value: String(stats.completed),
      trend: stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completion` : "0%",
      trendUp: true,
      style: "success" as const,
    },
    {
      label: "PENGHEMATAN",
      value: formatRupiah(stats.savings),
      trend: "dari review AI",
      trendUp: true,
      style: "primary" as const,
    },
  ];

  const styleMap = {
    warning: {
      iconBg: "bg-[var(--orange-1000)]",
      iconColor: "text-[var(--orange-600)]",
      valueBg: "",
    },
    default: {
      iconBg: "bg-[var(--sand-1000)]",
      iconColor: "text-[var(--sand-400)]",
      valueBg: "",
    },
    success: {
      iconBg: "bg-[var(--green-1100)]",
      iconColor: "text-[var(--green-500)]",
      valueBg: "",
    },
    primary: {
      iconBg: "bg-[var(--emerald-500)]/10",
      iconColor: "text-[var(--emerald-500)]",
      valueBg: "",
    },
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* ========== DARK CHARCOAL SIDEBAR ========== */}
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-40"
        style={{
          width: 264,
          backgroundColor: "var(--sidebar-background)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <span className="text-white font-bold text-sm font-display">M</span>
          </div>
          <span
            className="font-display text-lg font-semibold"
            style={{ color: "var(--sidebar-accent-foreground)" }}
          >
            MedNex
          </span>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <h3
                className="px-3 mb-2 font-mono text-[10px] font-semibold uppercase"
                style={{
                  color: "var(--sidebar-foreground)",
                  letterSpacing: "0.1em",
                }}
              >
                {section.label}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.path}
                        data-testid={`nav-${item.id}`}
                        onClick={() => {
                          if (item.path !== "/dashboard") {
                            sessionStorage.removeItem("dashboardScrollPosition");
                          }
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px]"
                        style={{
                          backgroundColor: isActive
                            ? "var(--sidebar-accent)"
                            : "transparent",
                          color: isActive
                            ? "var(--sidebar-accent-foreground)"
                            : "var(--sidebar-foreground)",
                        }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span
                            className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                            style={{
                              backgroundColor: "var(--primary)",
                              color: "#fff",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Settings - separate */}
          <div className="mb-5">
            <ul>
              <li>
                <button
                  onClick={openSettings}
                  data-testid="nav-admin"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px]"
                  style={{ color: "var(--sidebar-foreground)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--sidebar-accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 font-medium text-left">Pengaturan</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer: Avatar + User Info */}
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold text-sm"
              style={{
                backgroundColor: "var(--sidebar-accent)",
                color: "var(--sidebar-accent-foreground)",
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold truncate"
                style={{ color: "var(--sidebar-accent-foreground)" }}
              >
                {user?.name || "Dewi Analis"}
              </p>
              <p
                className="text-[11px] truncate"
                style={{ color: "var(--sidebar-foreground)" }}
              >
                Claims Adjuster
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1" style={{ marginLeft: 264 }}>
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{
            backgroundColor: "var(--background)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Dashboard
            </span>
            <span
              className="text-[13px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              /
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Command Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                minWidth: 240,
              }}
            >
              <Search
                className="w-4 h-4"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type="text"
                placeholder="Cari klaim, peserta..."
                className="bg-transparent border-none outline-none text-[13px] w-full"
                style={{ color: "var(--foreground)" }}
              />
            </div>

            {/* Upload Button */}
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold font-display transition-colors"
              style={{
                backgroundColor: "var(--primary)",
                color: "#fff",
              }}
            >
              <UploadIcon className="w-4 h-4" />
              Upload
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="px-8 py-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1
              className="font-display text-2xl font-semibold mb-1"
              style={{ color: "var(--foreground)" }}
            >
              {getGreeting()}, {firstName}
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {formatDate()}
            </p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => {
              const s = styleMap[card.style];
              return (
                <div
                  key={card.label}
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Label */}
                  <p
                    className="font-mono text-[10px] font-semibold uppercase mb-3"
                    style={{
                      color: "var(--muted-foreground)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {card.label}
                  </p>
                  {/* Value */}
                  <p
                    className="font-mono text-[32px] font-bold mb-2"
                    style={{
                      color: "var(--foreground)",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {card.value}
                  </p>
                  {/* Trend */}
                  <div className="flex items-center gap-1.5">
                    {card.trendUp ? (
                      <TrendingUp
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--green-500)" }}
                      />
                    ) : (
                      <TrendingDown
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--orange-600)" }}
                      />
                    )}
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {card.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Perlu Perhatianmu - Action Cards */}
          <div className="mb-8">
            <DashboardMenuBoxes processedClaims={claims} />
          </div>

          {/* Issue Terdeteksi - Stacked Bar Chart */}
          <div className="mb-8">
            <ClaimsBarChart claims={claims} onRefresh={refreshData} />
          </div>

          {/* Claims Activity Feed */}
          <div className="mb-8">
            <ClaimsActivityFeed />
          </div>
        </main>
      </div>

      <LoadingOverlay />

      {/* Admin Settings Modal - renders on top when on /settings/admin route */}
      {matchAdmin && <AdminSettings />}
    </div>
  );
}
