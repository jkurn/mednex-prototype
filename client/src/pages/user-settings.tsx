import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { LogOut, User } from "lucide-react";

export default function UserSettings() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <Sidebar />
      <div className="ml-64">
        <main className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Pengaturan Pengguna</h1>
            <p className="text-xs text-gray-500 mt-1">Kelola informasi akun dan preferensi Anda</p>
          </div>

          <div className="grid gap-6">
            {/* User Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Informasi Pengguna</CardTitle>
                <CardDescription className="text-xs">Detail akun dan informasi kontak Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900" data-testid="text-user-email">
                      {user?.username || "demouser@strator-ai.com"}
                    </p>
                    <p className="text-[10px] text-gray-500">Administrator Access</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Email</dt>
                      <dd className="mt-1 text-xs text-gray-900">
                        {user?.username || "demouser@strator-ai.com"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Role</dt>
                      <dd className="mt-1 text-xs text-gray-900">Administrator</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Organization</dt>
                      <dd className="mt-1 text-xs text-gray-900">
                        PT Asuransi ABC Indonesia
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>

            {/* Session Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Manajemen Sesi</CardTitle>
                <CardDescription className="text-xs">Kelola sesi login Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full sm:w-auto text-xs h-8 px-3"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3 h-3 mr-1.5" />
                  Keluar dari Akun
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Keluar akan mengakhiri sesi Anda saat ini dan Anda perlu login kembali untuk mengakses sistem.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
