import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, User, CreditCard, Trash2, Database, LogOut } from "lucide-react";
import { generateDemoClaimsData } from "@/services/demoData";
import { generateMemberSeedData, generatePolicySeedData } from "@/services/realSeedData";
import { generateDemoTariffData, generateDemoProviderActivities } from "@/services/tariffDemoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { DATA_VERSION } from "@/hooks/useClaimsData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingsTab = "profilmu" | "tagihan";

export default function AdminSettings() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { closeSettings } = useSettingsModal();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profilmu");
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [demoDataSeeded, setDemoDataSeeded] = useState(false);

  useEffect(() => {
    const seeded = localStorage.getItem('strator_demo_data_seeded');
    setDemoDataSeeded(seeded === 'true');
  }, []);

  const handleSeedDemoData = async () => {
    if (demoDataSeeded) return;
    
    setIsSeeding(true);
    try {
      // Step 1: Seed real member data from PT. Mitra Iswara & Rorimpandey Ltd
      const realMembers = generateMemberSeedData();
      
      // Store members in localStorage FIRST (so demoData.ts can access them for validation)
      localStorage.setItem('strator_seeded_members', JSON.stringify(realMembers));
      
      // Create members in database (for backend API access)
      await fetch('/api/members/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: realMembers })
      });

      // Step 1.5: Seed real policy with TC endorsement clauses
      const realPolicy = generatePolicySeedData();
      localStorage.setItem('strator_policies', JSON.stringify([realPolicy]));

      // Step 2: Generate claims - member validation is now done internally by generateDemoClaimsData()
      // which looks up each member from localStorage and generates memberValidation objects
      const demoData = generateDemoClaimsData();
      
      localStorage.setItem('strator_claims', JSON.stringify(demoData));
      
      // Step 3: Seed tariff book data for Provider & Buku Tarif module
      const tariffData = generateDemoTariffData();
      localStorage.setItem('strator_tariff_books', JSON.stringify(tariffData));

      // Step 4: Seed provider activities
      const providerActivities = generateDemoProviderActivities();
      localStorage.setItem('strator_provider_activities', JSON.stringify(providerActivities));
      
      localStorage.setItem('strator_demo_data_seeded', 'true');
      localStorage.setItem('strator_data_version', DATA_VERSION);
      localStorage.removeItem('strator_data_reset');
      setDemoDataSeeded(true);
      
      setTimeout(() => {
        setIsSeeding(false);
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error seeding demo data:', error);
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    closeSettings();
    logout();
    localStorage.removeItem('strator_demo_data_seeded');
    setLocation("/");
  };

  const handleResetAllData = async () => {
    setIsResetting(true);
    
    try {
      // Clear all members from database (Polis & Peserta module)
      await fetch('/api/members/all', { method: 'DELETE' });
      
      // Set reset flag BEFORE clearing data - prevents auto-loading demo data on reload
      localStorage.setItem('strator_data_reset', 'true');
      
      // Clear all localStorage data except we KEEP strator_claims as empty array
      // This prevents auto-load of demo data since claims exist (just empty)
      localStorage.setItem('strator_claims', '[]');
      localStorage.removeItem('strator_user_profile');
      localStorage.removeItem('strator_last_updated');
      localStorage.removeItem('strator_policies');
      localStorage.removeItem('strator_policy_activities');
      localStorage.removeItem('strator_audit_logs');
      localStorage.removeItem('strator_demo_data_seeded');
      localStorage.removeItem('strator_seeded_members');
      localStorage.removeItem('strator_tariff_books');
      localStorage.removeItem('strator_provider_activities');
      setDemoDataSeeded(false);
      
      // Reset form fields
      setFullName("");
      setPreferredName("");
      
      setTimeout(() => {
        setIsResetting(false);
        // Force page reload to reset all state
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error resetting data:', error);
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    // Load saved profile from localStorage
    const savedProfile = localStorage.getItem('strator_user_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setFullName(profile.fullName || "");
      setPreferredName(profile.preferredName || "");
    } else if (user?.username) {
      // Default from email if no saved profile
      const emailName = user.username.split("@")[0];
      setPreferredName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }
  }, [user]);

  const handleClose = () => {
    closeSettings();
  };

  const getInitials = () => {
    // Use preferred name or full name if available
    if (preferredName.trim()) {
      const parts = preferredName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return preferredName.substring(0, 2).toUpperCase();
    }
    if (fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    // Fallback to email
    const email = user?.username || "demouser@strator-ai.com";
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleUpdate = () => {
    const profile = {
      fullName,
      preferredName,
    };
    localStorage.setItem('strator_user_profile', JSON.stringify(profile));
    closeSettings();
  };

  const handleCancel = () => {
    closeSettings();
  };

  if (!isAuthenticated) {
    return null;
  }

  const userEmail = user?.username || "demouser@strator-ai.com";
  const initials = getInitials();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-[90vw] max-w-[1200px] h-[90vh] bg-white shadow-2xl rounded-lg overflow-hidden flex">
        {/* Left Sidebar */}
        <div className="w-[220px] bg-[#fbfbfa] border-r border-gray-200 flex flex-col">
          {/* User Email Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">
              {userEmail}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {/* Akunmu Section */}
            <div className="px-3 py-2">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Akunmu
              </h3>
              <button
                onClick={() => setActiveTab("profilmu")}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  activeTab === "profilmu"
                    ? "bg-gray-200/80 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                data-testid="tab-profilmu"
              >
                <User className="w-4 h-4" />
                <span>Profilmu</span>
              </button>
            </div>

            {/* Workspace Section */}
            <div className="px-3 py-2 mt-2">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Workspace
              </h3>
              <button
                onClick={() => setActiveTab("tagihan")}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  activeTab === "tagihan"
                    ? "bg-gray-200/80 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                data-testid="tab-tagihan"
              >
                <CreditCard className="w-4 h-4" />
                <span>Tagihan</span>
              </button>
            </div>
          </nav>

          {/* Actions Section - Bottom of Sidebar */}
          <div className="px-3 py-3 border-t border-gray-200 space-y-1">
            {/* 1. Tambah Data Dummy */}
            <button
              onClick={handleSeedDemoData}
              disabled={demoDataSeeded || isSeeding}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                demoDataSeeded 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              data-testid="button-seed-demo"
            >
              <Database className="w-4 h-4" />
              <span>{isSeeding ? "Menambahkan..." : demoDataSeeded ? "Data Dummy Sudah Ada" : "Tambah Data Dummy"}</span>
            </button>

            {/* 2. Reset Semua Data */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-red-600 hover:bg-red-50 transition-colors"
                  data-testid="button-reset-data"
                  disabled={isResetting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isResetting ? "Menghapus..." : "Reset Semua Data"}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Semua Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua data yang telah diupload, termasuk:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Profil pengguna (nama lengkap, nama panggilan)</li>
                      <li>Semua data klaim yang telah disubmit</li>
                      <li>Semua data polis dan peserta</li>
                      <li>Log aktivitas dan audit</li>
                    </ul>
                    <p className="mt-3 font-medium">Data yang dihapus tidak dapat dikembalikan.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-reset">Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetAllData}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-confirm-reset"
                  >
                    Ya, Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* 3. Keluar */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Close Button */}
          <div className="flex justify-end p-3">
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              data-testid="button-close-settings"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-10 pb-8">
            {activeTab === "profilmu" && (
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-8">Akun</h1>

                {/* Foto Section */}
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">Foto</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                      {initials}
                    </div>
                  </div>
                </div>

                {/* Informasimu Section */}
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">Informasimu</h2>
                  
                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">Email</label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900">{userEmail}</span>
                      <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        Ubah email
                      </button>
                    </div>
                  </div>

                  {/* Nama Lengkapmu */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">Nama Lengkapmu</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ketik nama lengkapmu"
                      className="max-w-md h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                      data-testid="input-full-name"
                    />
                  </div>

                  {/* Nama Panggilan */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nama Panggilan</label>
                    <Input
                      type="text"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="Ketik nama panggilanmu"
                      className="max-w-md h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                      data-testid="input-preferred-name"
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">Password</h2>
                  
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Password yang sekarang</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Ketik password yang kamu pakai sekarang"
                        className="h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                        data-testid="input-current-password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Password yang baru</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ketik password yang baru"
                        className="h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                        data-testid="input-new-password"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleUpdate}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 h-9 text-sm font-medium"
                    data-testid="button-update-profile"
                  >
                    Simpan
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="px-4 h-9 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    data-testid="button-cancel"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "tagihan" && (
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-8">Tagihan</h1>

                {/* Current Plan */}
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">Paket saat ini</h2>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Demo</h3>
                        <p className="text-sm text-gray-500 mt-1">Akses penuh untuk evaluasi produk</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">Informasi tagihan</h2>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Versi demo tidak memerlukan pembayaran. Untuk informasi langganan enterprise, 
                      silakan hubungi tim sales kami.
                    </p>
                  </div>
                </div>

                {/* Contact Sales */}
                <div>
                  <Button
                    variant="outline"
                    className="px-4 h-9 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    data-testid="button-contact-sales"
                  >
                    Hubungi Sales
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
