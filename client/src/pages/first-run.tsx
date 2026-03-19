import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Upload,
  History,
  Building2,
  Users,
  BookOpen,
  CloudUpload,
  ShieldCheck,
  SearchCheck,
  Lightbulb,
} from "lucide-react";

export default function FirstRun() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Command Center",
      active: true,
      badge: 0,
      path: "/dashboard",
    },
    { icon: Upload, label: "Upload Klaim", active: false, path: "/first-run" },
    { icon: History, label: "Riwayat Klaim", active: false, path: "/klaim" },
    {
      icon: Building2,
      label: "Provider",
      active: false,
      path: "/provider-tarif",
    },
    {
      icon: Users,
      label: "Peserta",
      active: false,
      path: "/daftar-peserta",
    },
    {
      icon: BookOpen,
      label: "Tarif Book",
      active: false,
      path: "/provider-tarif",
    },
  ];

  const featureCards = [
    {
      icon: ShieldCheck,
      title: "AI Checkpoint",
      description: "7 step analisis komprehensif untuk setiap klaim",
    },
    {
      icon: SearchCheck,
      title: "Deteksi Fraud",
      description: "Deteksi otomatis pola fraud, overpricing, upcoding",
    },
    {
      icon: Lightbulb,
      title: "Rekomendasi",
      description: "Saran keputusan AI berdasarkan data & aturan OJK",
    },
  ];

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop in the future
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#FEFCF4" }}>
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen flex flex-col justify-between"
        style={{
          width: 264,
          backgroundColor: "#2D2926",
          zIndex: 50,
        }}
      >
        {/* Logo + Nav */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 32,
                height: 32,
                backgroundColor: "#FD6325",
              }}
            >
              <span
                className="text-white font-bold text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                M
              </span>
            </div>
            <span
              className="text-white font-bold text-lg"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              MedNex
            </span>
          </div>

          {/* Nav items */}
          <nav className="mt-2 flex flex-col gap-0.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.path}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: item.active
                        ? "rgba(253, 99, 37, 0.12)"
                        : "transparent",
                      color: item.active ? "#FD6325" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    <Icon size={18} />
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: item.active ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.active && item.badge !== undefined && (
                      <span
                        className="ml-auto flex items-center justify-center text-xs font-semibold text-white rounded-full"
                        style={{
                          backgroundColor: "#FD6325",
                          width: 20,
                          height: 20,
                          fontSize: 11,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: User info */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "rgba(253, 99, 37, 0.18)",
              color: "#FD6325",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            DA
          </div>
          <div className="flex flex-col">
            <span
              className="text-white text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {user?.name || "Dewi Analis"}
            </span>
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Claims Adjuster
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col items-center justify-center"
        style={{ marginLeft: 264, minHeight: "100vh" }}
      >
        <div className="flex flex-col items-center" style={{ maxWidth: 560 }}>
          {/* Step indicator pill */}
          <div
            className="inline-flex items-center rounded-full px-3 py-1 mb-6"
            style={{
              backgroundColor: "rgba(253, 99, 37, 0.1)",
              color: "#FD6325",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            1/2 — Upload Klaim Pertama
          </div>

          {/* Heading */}
          <h1
            className="text-center font-bold mb-2"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 32,
              color: "#3A3632",
            }}
          >
            Selamat datang di MedNex!
          </h1>

          {/* Subtitle */}
          <p
            className="text-center mb-8"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: "#97958E",
            }}
          >
            Mulai dengan mengupload klaim pertama Anda
          </p>

          {/* Upload drop zone */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{
              width: 480,
              height: 160,
              border: `2px dashed ${isDragging ? "#FD6325" : "#D6D4CC"}`,
              borderRadius: 12,
              backgroundColor: isDragging
                ? "rgba(253, 99, 37, 0.04)"
                : "transparent",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <CloudUpload
              size={32}
              style={{ color: isDragging ? "#FD6325" : "#D6D4CC" }}
            />
            <p
              className="mt-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "#3A3632",
                fontWeight: 500,
              }}
            >
              Drag & drop file PDF klaim di sini
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: "#97958E",
              }}
            >
              atau klik untuk memilih file
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={() => {
              /* handle file selection */
            }}
          />

          {/* Upload button */}
          <button
            className="mt-6 text-white font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#FD6325",
              borderRadius: 8,
              padding: "12px 32px",
              fontSize: 15,
              fontFamily: "'Inter', sans-serif",
            }}
            onClick={handleUploadClick}
          >
            Upload Klaim Pertama
          </button>

          {/* Feature cards */}
          <div
            className="grid grid-cols-3 gap-4 mt-10"
            style={{ width: 480 }}
          >
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col items-center text-center p-4"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    border: "1px solid #ECEAE3",
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg mb-3"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "rgba(253, 99, 37, 0.08)",
                      color: "#FD6325",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3
                    className="font-semibold mb-1"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: "#3A3632",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: "#97958E",
                      lineHeight: 1.4,
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Skip tour link */}
          <button
            className="mt-8 mb-8 transition-opacity hover:opacity-70"
            style={{
              background: "none",
              border: "none",
              color: "#97958E",
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer",
            }}
            onClick={() => setLocation("/dashboard")}
          >
            Lewati Tour
          </button>
        </div>
      </main>
    </div>
  );
}
