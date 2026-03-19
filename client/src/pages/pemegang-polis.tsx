import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, ChevronDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
} from "chart.js";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/dashboard/Sidebar";
import PemegangPolisBaruModal from "@/components/pemegang-polis/PemegangPolisBaruModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { PolicyActivity, PolicyMetrics, MemberMetrics } from "@shared/schema";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

// Same sample policies as daftar-polis.tsx for consistent counting
const samplePolicies = [
  { id: 'demo', status: 'Aktif' },
  { id: 'pol-002', status: 'Aktif' },
  { id: 'pol-003', status: 'Aktif' },
  { id: 'pol-004', status: 'Tidak Aktif' },
];

export default function PemegangPolisPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPolisBaruModal, setShowPolisBaruModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<PolicyActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // Client-side policy count to match daftar-polis.tsx logic
  const [localPolicyCount, setLocalPolicyCount] = useState<number>(0);
  const [policyCountLoading, setPolicyCountLoading] = useState(true);

  // Calculate policy count from localStorage (same logic as daftar-polis.tsx)
  useEffect(() => {
    const calculatePolicyCount = () => {
      const dataWasReset = localStorage.getItem('strator_data_reset') === 'true';
      const storedPolicies = localStorage.getItem('strator_policies');
      
      let allPolicies: { id: string; status: string }[] = [];
      
      if (dataWasReset) {
        // Only use localStorage policies after reset
        if (storedPolicies) {
          try {
            allPolicies = JSON.parse(storedPolicies);
          } catch {
            allPolicies = [];
          }
        }
      } else {
        // Normal mode: include sample policies as demo data
        if (storedPolicies) {
          try {
            const parsed = JSON.parse(storedPolicies);
            allPolicies = [...samplePolicies, ...parsed];
          } catch {
            allPolicies = samplePolicies;
          }
        } else {
          allPolicies = samplePolicies;
        }
      }
      
      const activeCount = allPolicies.filter(p => p.status === 'Aktif').length;
      setLocalPolicyCount(activeCount);
      setPolicyCountLoading(false);
    };
    
    calculatePolicyCount();
  }, [showPolisBaruModal]); // Re-calculate when modal closes (new policy added)

  // Load activities from localStorage
  useEffect(() => {
    const loadActivities = () => {
      const stored = localStorage.getItem('strator_policy_activities');
      if (stored) {
        try {
          setActivities(JSON.parse(stored));
        } catch (e) {
          setActivities([]);
        }
      }
      setActivitiesLoading(false);
    };
    loadActivities();
    
    // Listen for storage changes (in case of updates from other tabs/components)
    const handleStorage = () => loadActivities();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [showPolisBaruModal]); // Re-load when modal closes

  const { data: policyMetrics, isLoading: policyMetricsLoading } = useQuery<PolicyMetrics>({
    queryKey: ["/api/metrics/policies"],
  });

  const { data: memberMetrics, isLoading: memberMetricsLoading } = useQuery<MemberMetrics>({
    queryKey: ["/api/metrics/members"],
  });

  // Filter activities based on search term
  const filteredActivities = activities.filter(activity =>
    activity.policyholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter modal activities independently
  const filteredModalActivities = activities.filter(activity =>
    activity.policyholder.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    activity.activityType.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    activity.note.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  // Get 5 most recent activities for main view
  const recentActivities = filteredActivities.slice(0, 5);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Modal controls
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
        setModalSearchTerm("");
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
        setModalSearchTerm("");
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  // Chart.js configuration
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 0,
      },
    },
  };

  const createChartData = (data: number[], color: string) => ({
    labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: `${color}10`,
        fill: true,
      },
    ],
  });

  const policyChartData = policyMetrics
    ? createChartData(policyMetrics.trendData, "#3b82f6")
    : null;

  const memberChartData = memberMetrics
    ? createChartData(memberMetrics.trendData, "#3b82f6")
    : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="pl-6 py-6">
          {/* Header Section - Match Klaim exactly */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Polis & Peserta
            </h1>
            <p className="text-sm text-slate-600">
              Kelola seluruh Polis dan Kepesertaan portofoliomu dalam Dashboard Polis & Peserta ini.
            </p>
          </div>

          {/* Snapshot Polis & Peserta Container */}
          <Card className="border-slate-200 p-5 mb-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Snapshot Polis dan Peserta
            </h2>
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Polis Aktif Card */}
            <Card
              className="p-5 cursor-pointer hover:shadow-md transition-shadow border-slate-200"
              onClick={() => setLocation('/daftar-polis')}
              data-testid="card-polis-aktif"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>📋</span>
                  <span>Polis Aktif</span>
                </div>
              </div>
              <div className="text-3xl font-semibold text-slate-900 mb-4">
                {policyCountLoading ? "..." : localPolicyCount}
              </div>
              {policyChartData && (
                <div className="h-40 mb-4">
                  <Line data={policyChartData} options={chartOptions} />
                </div>
              )}
              <div className="text-xs text-slate-600">
                {policyMetrics && (
                  <span className="font-medium text-green-700">
                    +{policyMetrics.trendChange} polis dalam {policyMetrics.trendPeriod}
                  </span>
                )}
              </div>
            </Card>

            {/* Total Peserta Aktif Card */}
            <Card
              className="p-5 cursor-pointer hover:shadow-md transition-shadow border-slate-200"
              onClick={() => setLocation('/daftar-peserta')}
              data-testid="card-total-peserta"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>👥</span>
                  <span>Total Peserta Aktif</span>
                </div>
              </div>
              <div className="text-3xl font-semibold text-slate-900 mb-4">
                {memberMetricsLoading ? "..." : (memberMetrics?.currentValue || 0).toLocaleString('id-ID')}
              </div>
              {memberChartData && (
                <div className="h-40 mb-4">
                  <Line data={memberChartData} options={chartOptions} />
                </div>
              )}
              <div className="text-xs text-slate-600">
                {memberMetrics && (
                  <span className="font-medium text-green-700">
                    +{memberMetrics.trendChange} peserta dalam {memberMetrics.trendPeriod}
                  </span>
                )}
              </div>
            </Card>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="border-slate-200">
            <div className="p-4">
              {/* Header with Upload Baru button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Aktivitas Polis dan Peserta Terkini
                </h2>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-upload-baru"
                    >
                      Upload Baru
                      <ChevronDown className="ml-1.5 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom" className="w-72">
                    <DropdownMenuItem 
                      onClick={() => alert('👥 ENDORSEMEN PESERTA\n\nTambah, hapus, dan/atau ubah data Peserta...')}
                      className="flex flex-col items-start py-2"
                      data-testid="menu-endorsemen-peserta"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">👥</span>
                        <span className="font-medium">Endorsemen Peserta</span>
                      </div>
                      <span className="text-xs text-slate-500 pl-6">Tambah, hapus, dan/atau ubah data Peserta</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => alert('📋 ENDORSEMEN KLAUSULA\n\nEndorse ketentuan Polis tertentu...')}
                      className="flex flex-col items-start py-2"
                      data-testid="menu-endorsemen-klausula"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span className="font-medium">Endorsemen Klausula</span>
                      </div>
                      <span className="text-xs text-slate-500 pl-6">Endorse ketentuan Polis tertentu</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowPolisBaruModal(true)}
                      className="flex flex-col items-start py-2"
                      data-testid="menu-pemegang-polis-baru"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🆕</span>
                        <span className="font-medium">Pemegang Polis Baru</span>
                      </div>
                      <span className="text-xs text-slate-500 pl-6">Setup Pemegang Polis dan Peserta Awal baru</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Activity Table */}
              <div className="w-full">
                {/* Table Headers */}
                <div className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-2 pb-3 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <div>Waktu pemrosesan</div>
                  <div>Diproses oleh</div>
                  <div>Pemegang polis</div>
                  <div>
                    Aktivitas{" "}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-semibold">
                      AI
                    </span>
                  </div>
                </div>

                {/* Activity Rows */}
                {activitiesLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading activities...
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    No activities found
                  </div>
                ) : (
                  recentActivities.map((activity, idx) => (
                    <div
                      key={activity.id}
                      className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-3 border-b border-slate-100 last:border-b-0"
                      data-testid={`activity-row-${activity.id}`}
                    >
                      {/* Timestamp */}
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs text-slate-600">{activity.date}</div>
                        <div className="text-xs text-slate-500">{activity.time}</div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                          {activity.userInitials}
                        </div>
                        <span>{activity.user}</span>
                      </div>

                      {/* Policyholder */}
                      <div className="text-sm font-medium text-slate-900">
                        {activity.policyholder}
                      </div>

                      {/* Activity Type and Note Combined */}
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-slate-900">{activity.activityType}</div>
                        <div className="text-xs text-slate-600 leading-relaxed">{activity.note}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View All Button - Only show if there are more than 5 activities */}
              {activities.length > 5 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setModalSearchTerm("");
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                    data-testid="button-view-all"
                  >
                    Lihat Semua
                  </button>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          data-testid="modal-overlay"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-2xl flex flex-col w-[90%] max-w-[1200px] max-h-[85vh]"
            data-testid="modal-content"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 px-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Semua Aktivitas Polis dan Peserta
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalSearchTerm("");
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                data-testid="button-close-modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-5 px-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari dalam semua aktivitas..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  data-testid="input-modal-search"
                />
              </div>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto p-5 px-6">
              {/* Table Headers */}
              <div className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-2 pb-3 text-xs font-medium text-slate-500 border-b border-slate-200">
                <div>Waktu pemrosesan</div>
                <div>Diproses oleh</div>
                <div>Pemegang polis</div>
                <div>
                  Aktivitas{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-semibold">
                    AI
                  </span>
                </div>
              </div>

              {/* Activity Rows */}
              {filteredModalActivities.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No activities found
                </div>
              ) : (
                filteredModalActivities.map((activity, idx) => (
                  <div
                    key={activity.id}
                    className="grid grid-cols-[1fr_1.5fr_2fr_3fr] gap-4 py-3 border-b border-slate-100 last:border-b-0"
                    data-testid={`modal-activity-row-${activity.id}`}
                  >
                    {/* Timestamp */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-slate-600">{activity.date}</div>
                      <div className="text-xs text-slate-500">{activity.time}</div>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                        {activity.userInitials}
                      </div>
                      <span>{activity.user}</span>
                    </div>

                    {/* Policyholder */}
                    <div className="text-sm font-medium text-slate-900">
                      {activity.policyholder}
                    </div>

                    {/* Activity Type and Note Combined */}
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-slate-900">{activity.activityType}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">{activity.note}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pemegang Polis Baru Modal */}
      <PemegangPolisBaruModal
        isOpen={showPolisBaruModal}
        onClose={() => setShowPolisBaruModal(false)}
        onComplete={async (data) => {
          // Generate policy ID
          const policyId = `POL-${Date.now()}`;
          
          // Save policy to localStorage
          const policies = JSON.parse(localStorage.getItem('strator_policies') || '[]');
          const newPolicy = {
            id: policyId,
            policyholderName: data.policyholderName,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            benefitTypes: data.benefitTypes,
            totalMembers: data.memberSummary?.total || 0,
            employees: data.memberSummary?.employees || 0,
            dependents: data.memberSummary?.dependents || 0,
            benefitTiers: data.extractedTiers,
            endorsementClauses: data.extractedClauses,
            createdAt: new Date().toISOString(),
            status: 'Aktif',
          };
          policies.push(newPolicy);
          localStorage.setItem('strator_policies', JSON.stringify(policies));

          // Save members to database via API
          console.log('📋 Checking memberDataFile:', {
            hasFile: !!data.memberDataFile,
            hasExtractedData: !!data.memberDataFile?.extractedData,
            hasMembers: !!data.memberDataFile?.extractedData?.members,
            memberCount: data.memberDataFile?.extractedData?.members?.length || 0,
          });
          
          if (data.memberDataFile?.extractedData?.members) {
            try {
              const membersToSave = data.memberDataFile.extractedData.members;
              console.log(`🔄 Saving ${membersToSave.length} members to database...`);
              
              const response = await fetch('/api/members/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  members: membersToSave,
                  policyId: policyId,
                  policyNumber: policyId,
                  policyholderName: data.policyholderName,
                  policyExpiryDate: data.periodEnd,
                }),
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log(`✅ Saved ${result.count} members to database`);
                toast({
                  title: "Data peserta tersimpan",
                  description: `${result.count} peserta berhasil disimpan ke database`,
                });
              } else {
                const errorText = await response.text();
                console.error('Failed to save members to database:', response.status, errorText);
                toast({
                  title: "Gagal menyimpan peserta",
                  description: `Error: ${response.status} - ${errorText}`,
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error('Error saving members to database:', error);
              toast({
                title: "Error menyimpan peserta",
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: "destructive",
              });
            }
          } else {
            console.warn('⚠️ No member data found to save');
          }

          // Get user profile for activity logging - with proper fallbacks
          const userProfile = JSON.parse(localStorage.getItem('strator_user_profile') || '{}');
          // Priority: 1) preferredName from profile, 2) fullName from profile, 3) derive from email
          let userName = userProfile.preferredName || userProfile.fullName || '';
          if (!userName && user?.username) {
            // Derive from email (e.g., "demouser@strator-ai.com" -> "Demouser")
            const emailName = user.username.split("@")[0];
            userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
          if (!userName) userName = 'Unknown User';
          
          // Generate initials
          const nameParts = userName.split(' ');
          const userInitials = nameParts.length >= 2 
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            : userName.substring(0, 2).toUpperCase();

          // Format date and time
          const now = new Date();
          const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() + ' WIB';

          // Create activity log
          const activityNote = `Setup polis baru untuk ${data.policyholderName}. ${data.memberSummary?.total || 0} peserta (${data.memberSummary?.employees || 0} karyawan, ${data.memberSummary?.dependents || 0} tanggungan). ${data.extractedTiers.length} tingkat benefit.`;
          
          // Save to localStorage activities
          const storedActivities = JSON.parse(localStorage.getItem('strator_policy_activities') || '[]');
          const newActivity = {
            id: `ACT-${Date.now()}`,
            policyholder: data.policyholderName,
            activityType: '🆕 Pemegang Polis Baru',
            note: activityNote,
            user: userName,
            userInitials: userInitials,
            date: dateStr,
            time: timeStr,
            timestamp: now.toISOString(),
          };
          storedActivities.unshift(newActivity);
          localStorage.setItem('strator_policy_activities', JSON.stringify(storedActivities));

          // Update state directly for immediate UI refresh
          setActivities(storedActivities);

          // Invalidate queries to refresh metrics data
          queryClient.invalidateQueries({ queryKey: ['/api/metrics/policies'] });
          queryClient.invalidateQueries({ queryKey: ['/api/metrics/members'] });
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          queryClient.invalidateQueries({ queryKey: ['/api/members/stats/count'] });
          
          setShowPolisBaruModal(false);
        }}
        existingPolicyholders={[
          'PT Mitra Iswara & Rorimpandey Ltd',
          'PT Gold Coin Indonesia',
          'PT Surya Teknologi',
          'PT Bumi Jaya Abadi',
        ]}
      />
    </div>
  );
}
