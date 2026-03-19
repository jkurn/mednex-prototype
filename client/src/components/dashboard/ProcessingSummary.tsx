import { Card, CardContent } from "@/components/ui/card";
import { useClaimsData } from "@/hooks/useClaimsData";
import { formatRupiah } from "@/utils/formatters";

export default function ProcessingSummary() {
  const { claims, stats } = useClaimsData();

  const totalClaims = claims.length;
  const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
  const successRate = totalClaims > 0 ? (claims.filter(c => c.status === 'processed').length / totalClaims) * 100 : 0;
  const highValueAlerts = claims.filter(c => c.amount > 3000000).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Claims</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{totalClaims}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-medical text-primary text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-success mt-4">
            <i className="fas fa-arrow-up mr-1"></i>
            Ready for processing
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Amount</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{formatRupiah(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-money-bill-wave text-success text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-success mt-4">
            <i className="fas fa-check mr-1"></i>
            Ready for OJK Reporting
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Success Rate</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{successRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-success text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            <i className="fas fa-clock mr-1"></i>
            Last updated: {new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">High Value Alerts</p>
              <p className="text-3xl font-bold text-warning mt-2">{highValueAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-warning text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-warning mt-4">
            <i className="fas fa-info-circle mr-1"></i>
            Claims {'>'} Rp 3.000.000
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
