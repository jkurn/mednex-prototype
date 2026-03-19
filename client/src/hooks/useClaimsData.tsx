import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Claim, InsertClaim } from "@shared/schema";
import { analyzeClaim, calculateClaimRiskScore } from "@/services/fraudAnalysis";
import { cacheFile } from "@/utils/fileCache";
import { generateDemoClaimsData } from "@/services/demoData";

interface ProcessingStatus {
  progress: number;
  message: string;
}

interface ClaimsContextType {
  claims: Claim[];
  stats: any;
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  lastUpdated: Date | null;
  dataLoaded: boolean;
  addClaim: (claim: InsertClaim) => void;
  removeClaim: (id: string) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  clearClaims: () => void;
  refreshData: () => void;
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export const DATA_VERSION = '5.0'; // v5.0 - Clean default state, no demo data

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Check data version and clear old data if version mismatch
    const storedVersion = localStorage.getItem('strator_data_version');
    if (storedVersion !== DATA_VERSION) {
      console.log('🗑️ Clearing old data due to version change to clean state');
      localStorage.removeItem('strator_claims');
      localStorage.removeItem('strator_last_updated');
      localStorage.removeItem('strator_policies');
      localStorage.removeItem('strator_policy_activities');
      localStorage.setItem('strator_data_version', DATA_VERSION);
      localStorage.setItem('strator_data_reset', 'true');
      setClaims([]);
      setLastUpdated(null);
      setDataLoaded(true);
      return;
    }

    const storedClaims = localStorage.getItem('strator_claims');
    const storedLastUpdated = localStorage.getItem('strator_last_updated');
    
    if (storedClaims) {
      try {
        const parsedClaims = JSON.parse(storedClaims);
        setClaims(parsedClaims);
        if (storedLastUpdated) {
          setLastUpdated(new Date(storedLastUpdated));
        }
        setDataLoaded(true);
        return;
      } catch (error) {
        console.error('Failed to parse stored claims:', error);
      }
    }
    
    setClaims([]);
    setLastUpdated(null);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    try {
      const claimsToStore = claims.map(claim => ({
        ...claim,
        originalFileBase64: undefined,
        fileMimeType: claim.fileMimeType
      }));
      localStorage.setItem('strator_claims', JSON.stringify(claimsToStore));
    } catch (error) {
      console.error('Failed to save claims to localStorage:', error);
      try {
        const recentClaims = claims.slice(-20).map(claim => ({
          ...claim,
          originalFileBase64: undefined,
          fileMimeType: claim.fileMimeType
        }));
        localStorage.setItem('strator_claims', JSON.stringify(recentClaims));
      } catch (fallbackError) {
        console.error('Failed to save even reduced claims:', fallbackError);
        localStorage.removeItem('strator_claims');
      }
    }
  }, [claims, dataLoaded]);

  useEffect(() => {
    // Update processing state based on status
    setIsProcessing(!!processingStatus);
  }, [processingStatus]);

  const addClaim = (insertClaim: InsertClaim) => {
    const claimId = `claim-${Date.now()}-${Math.random()}`;
    
    const newClaim: Claim = {
      ...insertClaim,
      id: claimId,
      createdAt: new Date(),
    };
    
    // Cache file data in sessionStorage for PDF viewer
    if (insertClaim.originalFileBase64 && insertClaim.fileMimeType) {
      cacheFile(claimId, insertClaim.originalFileBase64, insertClaim.fileMimeType);
    }
    
    // Run fraud analysis on the new claim
    const fraudFlags = analyzeClaim(newClaim);
    const riskScore = calculateClaimRiskScore({ ...newClaim, fraudFlags });
    
    const claimWithFraudAnalysis: Claim = {
      ...newClaim,
      fraudFlags,
      riskScore,
    };
    
    setClaims(prev => [...prev, claimWithFraudAnalysis]);
    
    // Update last updated timestamp
    const now = new Date();
    setLastUpdated(now);
    localStorage.setItem('strator_last_updated', now.toISOString());
  };

  const removeClaim = (id: string) => {
    setClaims(prev => prev.filter(claim => claim.id !== id));
  };

  const updateClaim = (id: string, updates: Partial<Claim>) => {
    setClaims(prev => prev.map(claim => 
      claim.id === id ? { ...claim, ...updates } : claim
    ));
  };

  const handleSetProcessingStatus = (status: ProcessingStatus | null) => {
    setProcessingStatus(status);
  };

  const clearClaims = () => {
    setClaims([]);
    localStorage.removeItem('strator_claims');
    localStorage.removeItem('strator_last_updated');
    setLastUpdated(null);
  };

  const refreshData = () => {
    // Trigger a refresh of the data
    const now = new Date();
    setLastUpdated(now);
    localStorage.setItem('strator_last_updated', now.toISOString());
    
    // In a real app, this would fetch from API/SFTP
    // For now, we just update the timestamp
    console.log('Data refreshed at:', now);
  };

  // Calculate stats
  const stats = {
    totalClaims: claims.length,
    totalAmount: claims.reduce((sum, claim) => sum + claim.amount, 0),
    successRate: claims.length > 0 ? (claims.filter(c => c.status === 'processed').length / claims.length) * 100 : 0,
    highValueAlerts: claims.filter(c => c.amount > 3000000).length,
    todayProcessed: claims.filter(c => {
      const today = new Date().toDateString();
      const claimDate = new Date(c.createdAt).toDateString();
      return today === claimDate;
    }).length,
    averageAmount: claims.length > 0 ? claims.reduce((sum, claim) => sum + claim.amount, 0) / claims.length : 0,
    topProviders: [],
  };

  const value = {
    claims,
    stats,
    isProcessing,
    processingStatus,
    lastUpdated,
    dataLoaded,
    addClaim,
    removeClaim,
    updateClaim,
    setProcessingStatus: handleSetProcessingStatus,
    clearClaims,
    refreshData,
  };

  return (
    <ClaimsContext.Provider value={value}>
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaimsData() {
  const context = useContext(ClaimsContext);
  if (context === undefined) {
    throw new Error('useClaimsData must be used within a ClaimsProvider');
  }
  return context;
}