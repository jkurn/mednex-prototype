import { Card, CardContent } from "@/components/ui/card";
import { useClaimsData } from "@/hooks/useClaimsData";

export default function LoadingOverlay() {
  const { isProcessing, processingStatus } = useClaimsData();

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="shadow-2xl max-w-md w-full mx-4">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-cog fa-spin text-primary text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Processing Medical Claims</h3>
            <p className="text-slate-600 mb-6">Claude AI is extracting data from your documents...</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${processingStatus?.progress || 0}%` }}
              ></div>
            </div>
            {processingStatus && (
              <p className="text-sm text-slate-500 mt-3">
                {processingStatus.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
