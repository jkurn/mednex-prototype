import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useClaimsData } from "@/hooks/useClaimsData";
import { calculateFraudSummary } from "@/services/fraudAnalysis";
import { formatRupiah } from "@/utils/formatters";

export default function Analytics() {
  const { claims } = useClaimsData();
  const fraudSummary = calculateFraudSummary(claims);

  // Process data for provider cost analysis with risk assessment
  const providerData = claims.reduce((acc: Record<string, any>, claim) => {
    if (claim.provider && claim.provider !== "We couldn't find such information in the file") {
      if (!acc[claim.provider]) {
        acc[claim.provider] = {
          name: claim.provider,
          value: 0,
          claims: 0,
          overcharges: 0,
          color: '#10B981' // Default green
        };
      }
      
      acc[claim.provider].value += claim.amount;
      acc[claim.provider].claims += 1;
      
      // Calculate overcharges from fraud flags
      if (claim.fraudFlags) {
        const overcharge = claim.fraudFlags
          .filter(f => f.type === 'OVERPRICING')
          .reduce((sum, f) => sum + (f.excess || 0), 0);
        acc[claim.provider].overcharges += overcharge;
      }
    }
    return acc;
  }, {});

  // Set colors based on risk level
  Object.values(providerData).forEach((provider: any) => {
    const overchargeRate = provider.overcharges / provider.value;
    if (overchargeRate > 0.2) provider.color = '#EF4444'; // Red for >20% overcharge
    else if (overchargeRate > 0.1) provider.color = '#F59E0B'; // Orange for >10%
    else if (overchargeRate > 0.05) provider.color = '#FCD34D'; // Yellow for >5%
    else provider.color = '#10B981'; // Green for normal
  });

  const pieData = Object.values(providerData).map((provider: any) => ({
    name: provider.name.length > 20 ? provider.name.substring(0, 20) + "..." : provider.name,
    value: provider.claims,
    amount: provider.value,
    overcharges: provider.overcharges,
    fullName: provider.name,
    color: provider.color,
  }));

  // Process data for line chart (daily trends)
  const dailyData = claims.reduce((acc: Record<string, number>, claim) => {
    const date = new Date(claim.date).toLocaleDateString('en-US', { weekday: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const lineData = Object.entries(dailyData).map(([day, count]) => ({
    day,
    count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const overchargeRate = data.amount ? (data.overcharges / data.amount * 100) : 0;
      
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md">
          <p className="font-medium">{data.fullName || data.name}</p>
          <p className="text-primary">{`Claims: ${data.value || data.count}`}</p>
          {data.amount && (
            <>
              <p className="text-slate-600">{`Total: ${formatRupiah(data.amount)}`}</p>
              <p className="text-slate-600">{`Percentage: ${((data.value / claims.length) * 100).toFixed(1)}%`}</p>
              {data.overcharges > 0 && (
                <p className="text-red-600 font-medium">{`Overcharges: ${formatRupiah(data.overcharges)} (${overchargeRate.toFixed(1)}%)`}</p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-text-primary mb-6">
            <i className="fas fa-chart-pie mr-3 text-primary"></i>
Top 10 Hospitals by Claims Volume
          </h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <i className="fas fa-chart-pie text-4xl mb-4 text-slate-300"></i>
                <p>No data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-text-primary mb-6">
            <i className="fas fa-chart-bar mr-3 text-primary"></i>
            Top 10 ICD-10 Diagnosis Codes
          </h3>
          {(() => {
            // Process ICD-10 data
            const icdData = claims.reduce((acc: Record<string, number>, claim) => {
              if (claim.icd10 && claim.icd10 !== "N/A") {
                acc[claim.icd10] = (acc[claim.icd10] || 0) + 1;
              }
              return acc;
            }, {});
            
            const icdChartData = Object.entries(icdData)
              .map(([code, count]) => ({ code, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
              
            return icdChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={icdChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="code" 
                      tick={{ fontSize: 12 }} 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, 'Cases']}
                      labelFormatter={(code) => `ICD-10: ${code}`}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <i className="fas fa-chart-bar text-4xl mb-4 text-slate-300"></i>
                  <p>No ICD-10 codes available</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
