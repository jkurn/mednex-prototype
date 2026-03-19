import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClaimsData } from "@/hooks/useClaimsData";
import { calculateFraudSummary, generateExecutiveReport } from "@/services/fraudAnalysis";
import { formatRupiah } from "@/utils/formatters";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FraudSummary() {
  const { claims } = useClaimsData();
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  
  const fraudSummary = calculateFraudSummary(claims);
  const executiveReport = generateExecutiveReport(claims);

  const ExecutiveReportModal = () => (
    <Dialog open={showExecutiveReport} onOpenChange={setShowExecutiveReport}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">EXECUTIVE FRAUD REPORT</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <h3 className="font-bold text-red-900 mb-2">CRITICAL FINDINGS</h3>
            <ul className="space-y-1 text-sm">
              {executiveReport.criticalFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <h3 className="font-bold text-yellow-900 mb-2">IMMEDIATE ACTIONS REQUIRED</h3>
            <ol className="space-y-1 text-sm">
              {executiveReport.immediateActions.map((action, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-yellow-600 mr-2">{idx + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <h3 className="font-bold text-green-900 mb-2">SAVINGS OPPORTUNITY</h3>
            <p className="text-2xl font-bold mt-2 text-green-800">
              {formatRupiah(executiveReport.annualSavingsProjection)} / year
            </p>
            <p className="text-sm text-gray-600">
              Based on {executiveReport.claimsAnalyzed} claims analyzed
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={() => setShowExecutiveReport(false)} className="bg-blue-600 text-white">
            Close Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {/* Fraud Detection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-50 border-2 border-red-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-red-700 font-bold text-sm">OVERPRICING DETECTED</h3>
              <i className="fas fa-exclamation-triangle text-red-600"></i>
            </div>
            <p className="text-2xl font-bold text-red-900 mb-1">
              {formatRupiah(fraudSummary.totalOvercharges)}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-red-600">{fraudSummary.overchargeCount} items flagged</p>
              {fraudSummary.overchargeCount > 0 && (
                <Badge className="bg-red-100 text-red-800 text-xs">HIGH RISK</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-2 border-orange-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-orange-700 font-bold text-sm">ER MISUSE</h3>
              <i className="fas fa-ambulance text-orange-600"></i>
            </div>
            <p className="text-2xl font-bold text-orange-900 mb-1">
              {fraudSummary.erMisuseCount} cases
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-orange-600">
                Savings: {formatRupiah(fraudSummary.erSavings)}
              </p>
              {fraudSummary.erMisuseCount > 0 && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">REVIEW</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-2 border-yellow-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-700 font-bold text-sm">PROVIDER RISK</h3>
              <i className="fas fa-shield-alt text-yellow-600"></i>
            </div>
            <p className="text-lg font-bold text-yellow-900 mb-1 truncate" title={fraudSummary.highestRiskProvider}>
              {fraudSummary.highestRiskProvider || "No high risk"}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-yellow-600">
                {fraudSummary.highestMarkup}% avg markup
              </p>
              {fraudSummary.highestMarkup > 200 && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">AUDIT</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-2 border-green-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-green-700 font-bold text-sm">TOTAL SAVINGS FOUND</h3>
              <i className="fas fa-piggy-bank text-green-600"></i>
            </div>
            <p className="text-2xl font-bold text-green-900 mb-1">
              {formatRupiah(fraudSummary.totalSavings)}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-600">From {fraudSummary.processedClaims} claims</p>
              {fraudSummary.totalSavings > 0 && (
                <Badge className="bg-green-100 text-green-800 text-xs">RECOVERED</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Report Button */}
      {claims.length > 0 && (
        <div className="flex justify-center mb-6">
          <Button 
            onClick={() => setShowExecutiveReport(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-semibold"
          >
            <i className="fas fa-file-alt mr-2"></i>
            Generate Executive Report
          </Button>
        </div>
      )}

      <ExecutiveReportModal />
    </>
  );
}