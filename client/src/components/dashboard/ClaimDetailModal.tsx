import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Claim } from "@shared/schema";
import { formatRupiah, formatDateIndonesian } from "@/utils/formatters";

interface ClaimDetailModalProps {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimDetailModal({ claim, isOpen, onClose }: ClaimDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'file'>('analysis');

  const getFileDisplayContent = () => {
    if (claim.originalFileBase64 && claim.fileMimeType) {
      if (claim.fileMimeType === 'application/pdf') {
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* Try embed first, fallback to download link */}
              <embed
                src={`data:application/pdf;base64,${claim.originalFileBase64}`}
                type="application/pdf"
                width="100%"
                height="500"
                className="rounded"
              />
              {/* Alternative: Download link for better compatibility */}
              <div className="mt-4 text-center">
                <a
                  href={`data:application/pdf;base64,${claim.originalFileBase64}`}
                  download={claim.fileName}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download PDF
                </a>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              <i className="fas fa-file-pdf text-red-600 mr-2"></i>
              Original PDF: {claim.fileName}
            </div>
          </div>
        );
      } else {
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <img
                src={`data:${claim.fileMimeType};base64,${claim.originalFileBase64}`}
                alt={claim.fileName}
                className="max-w-full max-h-96 mx-auto shadow-md rounded"
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              <i className="fas fa-file-image text-blue-600 mr-2"></i>
              Original Image: {claim.fileName}
            </div>
          </div>
        );
      }
    } else {
      // Debug information for troubleshooting
      console.log('File display debug:', {
        hasBase64: !!claim.originalFileBase64,
        hasMimeType: !!claim.fileMimeType,
        base64Length: claim.originalFileBase64?.length,
        mimeType: claim.fileMimeType,
        fileName: claim.fileName
      });
      
      // Fallback for claims without stored file data
      if (claim.fileName.toLowerCase().includes('.pdf')) {
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center h-64 flex flex-col items-center justify-center">
            <i className="fas fa-file-pdf text-6xl text-red-600 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">PDF Document</h3>
            <p className="text-gray-600 mb-2">{claim.fileName}</p>
            <p className="text-sm text-gray-500">Original file not available for viewing</p>
            <p className="text-xs text-red-500 mt-2">
              Debug: Base64={!!claim.originalFileBase64}, MimeType={claim.fileMimeType}
            </p>
          </div>
        );
      } else {
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center h-64 flex flex-col items-center justify-center">
            <i className="fas fa-file-image text-6xl text-blue-600 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Image Document</h3>
            <p className="text-gray-600 mb-2">{claim.fileName}</p>
            <p className="text-sm text-gray-500">Original file not available for viewing</p>
            <p className="text-xs text-red-500 mt-2">
              Debug: Base64={!!claim.originalFileBase64}, MimeType={claim.fileMimeType}
            </p>
          </div>
        );
      }
    }
  };

  const getFraudAnalysisDetails = () => {
    if (!claim.fraudFlags || claim.fraudFlags.length === 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-check-circle text-green-600 mr-3 text-xl"></i>
            <h4 className="text-lg font-bold text-green-800">No Fraud Detected</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <h5 className="font-semibold text-green-700 mb-2">Security Checks Passed:</h5>
              <ul className="text-sm text-green-600 space-y-1">
                <li>✓ Amount within normal range</li>
                <li>✓ Provider has good reputation</li>
                <li>✓ Diagnosis matches service type</li>
                <li>✓ No suspicious patterns detected</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded border">
              <h5 className="font-semibold text-green-700 mb-2">Claim Details:</h5>
              <div className="text-sm text-green-600 space-y-1">
                <div><strong>Amount:</strong> {formatRupiah(claim.amount)}</div>
                <div><strong>Risk Score:</strong> {claim.riskScore || 0}/100</div>
                <div><strong>Status:</strong> Approved</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const totalSavings = claim.fraudFlags.reduce((sum, flag) => sum + (flag.estimatedSaving || 0), 0);

    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-red-800 flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {claim.fraudFlags.length} Fraud Flag{claim.fraudFlags.length > 1 ? 's' : ''} Detected
            </h4>
            {totalSavings > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Potential Savings</div>
                <div className="text-lg font-bold text-green-600">{formatRupiah(totalSavings)}</div>
              </div>
            )}
          </div>
        </div>

        {claim.fraudFlags.map((flag, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${
              flag.severity === 'HIGH' 
                ? 'bg-red-50 border-red-200' 
                : flag.severity === 'MEDIUM'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <i className={`mr-3 text-xl ${
                  flag.severity === 'HIGH' ? 'fas fa-exclamation-triangle text-red-600' :
                  flag.severity === 'MEDIUM' ? 'fas fa-exclamation-circle text-yellow-600' :
                  'fas fa-info-circle text-orange-600'
                }`}></i>
                <div>
                  <h5 className={`font-bold text-lg ${
                    flag.severity === 'HIGH' ? 'text-red-800' :
                    flag.severity === 'MEDIUM' ? 'text-yellow-800' :
                    'text-orange-800'
                  }`}>
                    {flag.type.replace('_', ' ')} Detection
                  </h5>
                  <Badge className={`mt-1 ${
                    flag.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                    flag.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {flag.severity} RISK
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h6 className="font-semibold mb-2">Issue Description</h6>
                <p className="text-sm mb-2">{flag.description}</p>
                {flag.reason && (
                  <p className="text-sm text-gray-600"><strong>Reason:</strong> {flag.reason}</p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h6 className="font-semibold mb-2">Financial Impact</h6>
                {flag.type === 'OVERPRICING' && flag.item && (
                  <div className="space-y-2 text-sm">
                    <div><strong>Item:</strong> {flag.item}</div>
                    <div><strong>Charged:</strong> {formatRupiah(flag.charged || 0)}</div>
                    <div><strong>Market Price:</strong> {formatRupiah(flag.marketPrice || 0)}</div>
                    <div><strong>Markup:</strong> {flag.markup}</div>
                  </div>
                )}
                
                {flag.estimatedSaving && flag.estimatedSaving > 0 && (
                  <div className="mt-3 p-3 bg-green-100 rounded border-l-4 border-green-500">
                    <div className="flex items-center mb-1">
                      <i className="fas fa-piggy-bank text-green-600 mr-2"></i>
                      <span className="font-medium text-green-800">
                        Potential Savings: {formatRupiah(flag.estimatedSaving)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600">
                      Money that could be saved if this issue is addressed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <i className="fas fa-file-medical mr-3 text-blue-600"></i>
            Claim Details: {claim.fileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Provider</div>
              <div className="font-semibold">{claim.provider}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Amount</div>
              <div className="font-semibold text-green-600">{formatRupiah(claim.amount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Patient ID</div>
              <div className="font-semibold">{claim.patientId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Date</div>
              <div className="font-semibold">{formatDateIndonesian(claim.date)}</div>
            </div>
          </div>

          {/* File Information */}
          <div className="p-4 bg-white border rounded-lg">
            <h5 className="font-semibold mb-3">File Information</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Filename:</strong> {claim.fileName}</div>
              <div><strong>Processed:</strong> {new Date(claim.createdAt).toLocaleString('id-ID')}</div>
              <div><strong>File Type:</strong> {claim.fileName.toLowerCase().includes('.pdf') ? 'PDF Document' : 'Image File'}</div>
              <div><strong>Status:</strong> {claim.status}</div>
              <div><strong>Diagnosis:</strong> {claim.diagnosis}</div>
              <div><strong>ICD-10:</strong> {claim.icd10 || 'N/A'}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'analysis' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              <i className="fas fa-shield-alt mr-2"></i>
              Fraud Analysis
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'file' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('file')}
            >
              <i className="fas fa-file mr-2"></i>
              Original Document
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'analysis' && getFraudAnalysisDetails()}
            
            {activeTab === 'file' && (
              <div>
                {getFileDisplayContent()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              <i className="fas fa-times mr-2"></i>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}