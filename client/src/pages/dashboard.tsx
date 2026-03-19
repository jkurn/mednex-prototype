import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useClaimsData } from "@/hooks/useClaimsData";

import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardMenuBoxes from "@/components/dashboard/DashboardMenuBoxes";
import ClaimsBarChart from "@/components/dashboard/ClaimsBarChart";
import ClaimsActivityFeed from "@/components/dashboard/ClaimsActivityFeed";
import LoadingOverlay from "@/components/dashboard/LoadingOverlay";
import AdminSettings from "@/pages/admin-settings";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { claims, addClaim, refreshData } = useClaimsData();
  const [, setLocation] = useLocation();
  const [matchAdmin] = useRoute("/settings/admin");

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
      // Try multiple times to ensure scroll happens after layout
      const attemptScroll = () => {
        window.scrollTo(0, scrollPos);
        // Verify scroll happened
        if (window.scrollY < scrollPos - 50) {
          requestAnimationFrame(attemptScroll);
        }
      };
      requestAnimationFrame(attemptScroll);
    } else {
      // No saved position (fresh login), scroll to top
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  }, []);

  // Dashboard now uses only real API data from Claude processing

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <Sidebar />
      <div className="ml-64">
        <main className="pl-6 py-6">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Klaim
            </h1>
            <p className="text-sm text-slate-600">
              Temukan segala hal yang berhubungan dengan Klaim di dashboard ini.
            </p>
          </div>

          {/* 1. Perlu Perhatianmu - Action Cards */}
          <div className="mb-8">
            <DashboardMenuBoxes processedClaims={claims} />
          </div>

          {/* 2. Issue Terdeteksi - Stacked Bar Chart */}
          <div className="mb-8">
            <ClaimsBarChart claims={claims} onRefresh={refreshData} />
          </div>

          {/* 3. Claims Activity Feed */}
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
