import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Claim } from "@shared/schema";
import { formatRupiah } from "@/utils/formatters";

interface ExpandableClaimRowProps {
  claim: Claim;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ExpandableClaimRow({ claim, isExpanded, onToggle }: ExpandableClaimRowProps) {
  const [imageError, setImageError] = useState(false);

  const getFileDisplayContent = () => {
    if (claim.fileName.toLowerCase().includes('.pdf')) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <i className="fas fa-file-pdf text-4xl text-red-600 mb-2"></i>
          <p className="text-gray-600">PDF File: {claim.fileName}</p>
          <p className="text-sm text-gray-500">Original PDF document cannot be displayed in browser</p>
        </div>
      );
    } else {
      // For images, we'd need the base64 data stored with the claim
      return (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <i className="fas fa-file-image text-4xl text-blue-600 mb-2"></i>
          <p className="text-gray-600">Image File: {claim.fileName}</p>
          <p className="text-sm text-gray-500">Original image processed and analyzed</p>
        </div>
      );
    }
  };

  const getFraudAnalysisDetails = () => {
    if (!claim.fraudFlags || claim.fraudFlags.length === 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-check-circle text-green-600 mr-2"></i>
            <h4 className="font-bold text-green-800">No Fraud Detected</h4>
          </div>
          <p className="text-green-700 text-sm">
            This claim passed all fraud detection checks:
          </p>
          <ul className="mt-2 text-sm text-green-600 list-disc list-inside">
            <li>Amount within normal range</li>
            <li>Provider has good reputation</li>
            <li>Diagnosis matches service type</li>
            <li>No suspicious patterns detected</li>
          </ul>
        </div>
      );
    }

    return (
      <div className="space-y-3">
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <i className={`mr-2 ${
                  flag.severity === 'HIGH' ? 'fas fa-exclamation-triangle text-red-600' :
                  flag.severity === 'MEDIUM' ? 'fas fa-exclamation-circle text-yellow-600' :
                  'fas fa-info-circle text-orange-600'
                }`}></i>
                <h4 className={`font-bold ${
                  flag.severity === 'HIGH' ? 'text-red-800' :
                  flag.severity === 'MEDIUM' ? 'text-yellow-800' :
                  'text-orange-800'
                }`}>
                  {flag.type.replace('_', ' ')} - {flag.severity} Risk
                </h4>
              </div>
              <Badge className={`${
                flag.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                flag.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {flag.severity}
              </Badge>
            </div>
            
            <p className={`text-sm mb-2 ${
              flag.severity === 'HIGH' ? 'text-red-700' :
              flag.severity === 'MEDIUM' ? 'text-yellow-700' :
              'text-orange-700'
            }`}>
              <strong>Issue:</strong> {flag.description}
            </p>
            
            {flag.reason && (
              <p className={`text-sm mb-2 ${
                flag.severity === 'HIGH' ? 'text-red-600' :
                flag.severity === 'MEDIUM' ? 'text-yellow-600' :
                'text-orange-600'
              }`}>
                <strong>Reason:</strong> {flag.reason}
              </p>
            )}
            
            {flag.type === 'OVERPRICING' && flag.item && (
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="font-medium">Item:</span> {flag.item}
                </div>
                <div>
                  <span className="font-medium">Charged:</span> {formatRupiah(flag.charged || 0)}
                </div>
                <div>
                  <span className="font-medium">Market Price:</span> {formatRupiah(flag.marketPrice || 0)}
                </div>
                <div>
                  <span className="font-medium">Markup:</span> {flag.markup}
                </div>
              </div>
            )}
            
            {flag.estimatedSaving && flag.estimatedSaving > 0 && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-green-500">
                <div className="flex items-center">
                  <i className="fas fa-piggy-bank text-green-600 mr-2"></i>
                  <span className="font-medium text-green-800">
                    Potential Savings: {formatRupiah(flag.estimatedSaving)}
                  </span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Impact: This represents money that could be saved if the issue is addressed
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isExpanded) return null;

  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original File Display */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-file mr-2 text-blue-600"></i>
                Original Document
              </h3>
              {getFileDisplayContent()}
              
              <div className="mt-4 text-sm text-gray-600 bg-white p-3 rounded border">
                <h4 className="font-medium mb-2">File Information:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Name:</strong> {claim.fileName}</div>
                  <div><strong>Size:</strong> {claim.fileName.toLowerCase().includes('.pdf') ? 'PDF Document' : 'Image File'}</div>
                  <div><strong>Processed:</strong> {new Date(claim.createdAt).toLocaleString('id-ID')}</div>
                  <div><strong>Status:</strong> {claim.status}</div>
                </div>
              </div>
            </div>

            {/* Fraud Analysis Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-shield-alt mr-2 text-red-600"></i>
                Fraud Analysis Details
              </h3>
              {getFraudAnalysisDetails()}
              
              {claim.riskScore !== undefined && (
                <div className="mt-4 bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">Risk Assessment:</h4>
                  <div className="flex items-center justify-between">
                    <span>Overall Risk Score:</span>
                    <Badge className={`${
                      claim.riskScore > 60 ? 'bg-red-100 text-red-800' :
                      claim.riskScore > 30 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {claim.riskScore}/100
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={onToggle}
              variant="outline"
              className="text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-chevron-up mr-2"></i>
              Close Details
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}