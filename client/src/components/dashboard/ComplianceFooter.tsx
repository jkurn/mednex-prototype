import { Card, CardContent } from "@/components/ui/card";

export default function ComplianceFooter() {
  const currentDate = new Date().toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <Card className="mt-8 bg-gradient-to-r from-primary/5 to-slate-100 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-check text-primary text-xl"></i>
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-primary">Indonesian Compliance Standards</h4>
              <p className="text-sm text-slate-600">All processed claims meet Indonesian financial authority requirements</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Last Compliance Check</p>
            <p className="text-lg font-semibold text-primary">{currentDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
