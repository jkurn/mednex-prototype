import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { ClaimActivity } from "@shared/schema";

export default function ClaimsActivityFeed() {
  const { data: activities = [], isLoading } = useQuery<ClaimActivity[]>({
    queryKey: ["/api/claim-activities"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Get 5 most recent activities
  const recentActivities = activities.slice(0, 5);

  return (
    <Card className="border-slate-200 mb-6">
      <div className="p-4">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Aktivitas Klaim Terkini
        </h2>

        {/* Activity Table */}
        <div className="w-full">
          {/* Table Headers */}
          <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_2.5fr] gap-4 py-2 pb-3 text-xs font-medium text-slate-500 border-b border-slate-200">
            <div>Waktu pemrosesan</div>
            <div>Diproses oleh</div>
            <div>Peserta</div>
            <div>Pemegang polis</div>
            <div>
              Aktivitas{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-semibold">
                AI
              </span>
            </div>
          </div>

          {/* Activity Rows */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading activities...
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Belum ada aktivitas klaim
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_2.5fr] gap-4 py-2.5 items-center hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                data-testid={`claim-activity-row-${activity.id}`}
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

                {/* Peserta */}
                <div className="text-sm font-medium text-slate-900">
                  {activity.peserta}
                </div>

                {/* Pemegang Polis */}
                <div className="text-sm text-slate-900">
                  {activity.policyHolderName}
                </div>

                {/* Aktivitas & Note */}
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm font-medium text-slate-900">
                    {activity.activityType}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {activity.note}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Button - Only show if there are more than 5 activities */}
        {!isLoading && activities.length > 5 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => window.location.assign((import.meta.env.BASE_URL || '/') + 'klaim')}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
              data-testid="button-view-all-claim-activities"
            >
              Lihat Semua Aktivitas Klaim
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
