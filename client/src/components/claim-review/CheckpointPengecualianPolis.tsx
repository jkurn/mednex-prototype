import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronUp, ChevronDown, CheckCircle2, XCircle, AlertCircle, Clock, FileText, ExternalLink, Building2 } from 'lucide-react';
import type { Claim } from '@shared/schema';
import { STANDARD_EXCLUSION_CLAUSES, ExclusionClause } from '@/data/exclusionClauses';

interface StoredPolicy {
  id: string;
  policyNumber?: string;
  policyholderName: string;
  endorsementClauses?: PolicyEndorsementClause[];
}

interface PolicyEndorsementClause {
  id?: string;
  pasal?: string;
  title: string;
  description?: string;
  keywords?: string[];
  type?: 'exclusion' | 'inclusion';
}

function getPolicyExclusionClauses(claim: Claim): { clauses: ExclusionClause[]; policyName: string | null } {
  try {
    const policiesJson = localStorage.getItem('strator_policies');
    if (!policiesJson) return { clauses: [], policyName: null };
    
    const policies: StoredPolicy[] = JSON.parse(policiesJson);
    if (!policies.length) return { clauses: [], policyName: null };
    
    const matchingPolicy = policies.find(policy => {
      if (claim.policyNumber && policy.policyNumber) {
        const claimNum = claim.policyNumber.toLowerCase().trim();
        const policyNum = policy.policyNumber.toLowerCase().trim();
        if (claimNum.includes(policyNum) || policyNum.includes(claimNum)) {
          return true;
        }
      }
      if (claim.policyHolderName && policy.policyholderName) {
        const claimHolder = claim.policyHolderName.toLowerCase().trim();
        const policyHolder = policy.policyholderName.toLowerCase().trim();
        if (claimHolder.includes(policyHolder) || policyHolder.includes(claimHolder)) {
          return true;
        }
      }
      return false;
    });
    
    if (!matchingPolicy || !matchingPolicy.endorsementClauses?.length) {
      return { clauses: [], policyName: matchingPolicy?.policyholderName || null };
    }
    
    const policyExclusionClauses: ExclusionClause[] = matchingPolicy.endorsementClauses
      .filter(ec => ec.type === 'exclusion' || !ec.type)
      .map((ec, idx) => ({
        id: 1000 + idx,
        pasal: ec.pasal || `Endorsement ${idx + 1}`,
        title: ec.title,
        description: ec.description || ec.title,
        keywords: ec.keywords || [ec.title.toLowerCase()],
        includesComplications: false,
        isFromPolicy: true,
      }));
    
    return { clauses: policyExclusionClauses, policyName: matchingPolicy.policyholderName };
  } catch (error) {
    console.error('Error loading policy exclusion clauses:', error);
    return { clauses: [], policyName: null };
  }
}

interface CheckpointPengecualianPolisProps {
  claim: Claim;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  isHighlighted: boolean;
  checkpointRef: React.RefObject<HTMLDivElement>;
  onDecisionChange: (decision: 'LANJUT' | 'TOLAK' | null, isOverride: boolean, justification: string) => void;
  onSave: (action: 'continue' | 'reject') => void;
}

type CP4Status = 'BUKAN_PENGECUALIAN' | 'PENGECUALIAN' | 'ADA_PENGECUALIAN' | 'PENDING';

interface DiagnosisAnalysis {
  icd10Code: string;
  diagnosisName: string;
  isPrimary: boolean;
  isExcluded: boolean;
  exclusionClausePasal: string | null;
  exclusionClauseTitle: string | null;
  exclusionSource: 'standard' | 'policy' | null;
  isComplication: boolean;
  relatedToDiagnosis: string | null;
}

export function CheckpointPengecualianPolis({
  claim,
  isExpanded,
  onExpandChange,
  isHighlighted,
  checkpointRef,
  onDecisionChange,
  onSave,
}: CheckpointPengecualianPolisProps) {
  const [selectedDecision, setSelectedDecision] = useState<'lanjut' | 'tolak' | null>(null);
  const [justification, setJustification] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { policyExclusionClauses, policyName } = useMemo(() => {
    const result = getPolicyExclusionClauses(claim);
    return { policyExclusionClauses: result.clauses, policyName: result.policyName };
  }, [claim]);

  const aiRecommendation = useMemo(() => {
    if (claim.cp4Decision?.aiRecommendation) {
      return claim.cp4Decision.aiRecommendation;
    }
    
    const allExclusionClauses = [...STANDARD_EXCLUSION_CLAUSES, ...policyExclusionClauses];
    const diagnosesFromClaim: DiagnosisAnalysis[] = [];
    
    if (claim.icd10Codes && claim.icd10Codes.length > 0) {
      claim.icd10Codes.forEach((icd, index) => {
        let matchingClause: (ExclusionClause & { isFromPolicy?: boolean }) | undefined;
        let source: 'standard' | 'policy' | null = null;
        
        matchingClause = policyExclusionClauses.find(clause => 
          clause.keywords.some(keyword => 
            icd.name.toLowerCase().includes(keyword.toLowerCase()) ||
            icd.code.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        if (matchingClause) {
          source = 'policy';
        } else {
          matchingClause = STANDARD_EXCLUSION_CLAUSES.find(clause => 
            clause.keywords.some(keyword => 
              icd.name.toLowerCase().includes(keyword.toLowerCase()) ||
              icd.code.toLowerCase().includes(keyword.toLowerCase())
            )
          );
          if (matchingClause) source = 'standard';
        }
        
        diagnosesFromClaim.push({
          icd10Code: icd.code,
          diagnosisName: icd.name,
          isPrimary: index === 0,
          isExcluded: !!matchingClause,
          exclusionClausePasal: matchingClause?.pasal || null,
          exclusionClauseTitle: matchingClause?.title || null,
          exclusionSource: source,
          isComplication: false,
          relatedToDiagnosis: null,
        });
      });
    } else if (claim.icd10) {
      diagnosesFromClaim.push({
        icd10Code: claim.icd10,
        diagnosisName: claim.diagnosis || 'N/A',
        isPrimary: true,
        isExcluded: false,
        exclusionClausePasal: null,
        exclusionClauseTitle: null,
        exclusionSource: null,
        isComplication: false,
        relatedToDiagnosis: null,
      });
    } else if (claim.diagnosis) {
      diagnosesFromClaim.push({
        icd10Code: 'N/A',
        diagnosisName: claim.diagnosis,
        isPrimary: true,
        isExcluded: false,
        exclusionClausePasal: null,
        exclusionClauseTitle: null,
        exclusionSource: null,
        isComplication: false,
        relatedToDiagnosis: null,
      });
    }

    const excludedCount = diagnosesFromClaim.filter(d => d.isExcluded).length;
    const totalCount = diagnosesFromClaim.length;
    
    let status: 'NOT_EXCLUDED' | 'EXCLUDED' | 'PARTIAL_EXCLUSION' = 'NOT_EXCLUDED';
    let recommendedAction: 'CONTINUE' | 'REJECT' = 'CONTINUE';
    
    if (excludedCount === totalCount && totalCount > 0) {
      status = 'EXCLUDED';
      recommendedAction = 'REJECT';
    } else if (excludedCount > 0) {
      status = 'PARTIAL_EXCLUSION';
      recommendedAction = 'CONTINUE';
    }

    const aiAnalysisText = claim.aiAnalysis?.pengecualianPolis || 
      (status === 'NOT_EXCLUDED' 
        ? `Diagnosa ${claim.diagnosis || 'pada klaim ini'} bukan termasuk dalam daftar pengecualian polis. Klaim dapat dilanjutkan ke checkpoint berikutnya.`
        : status === 'EXCLUDED'
        ? `Diagnosa ${claim.diagnosis || 'pada klaim ini'} termasuk dalam daftar pengecualian polis. Klaim harus ditolak.`
        : `Terdapat sebagian diagnosa yang dikecualikan. Porsi yang tidak dikecualikan dapat dilanjutkan.`);

    const hasPolicyExclusions = diagnosesFromClaim.some(d => d.exclusionSource === 'policy');
    
    return {
      status,
      confidence: 0.85 + Math.random() * 0.1,
      summary: aiAnalysisText.slice(0, 280),
      diagnosesAnalysis: diagnosesFromClaim,
      recommendedAction,
      policyReference: {
        document: hasPolicyExclusions && policyName ? `Polis ${policyName}` : 'Master Policy',
        clause: hasPolicyExclusions ? 'Endorsement Pengecualian Khusus' : 'Pasal IV: Daftar Pengecualian',
      },
      hasPolicySpecificExclusions: hasPolicyExclusions,
    };
  }, [claim, policyExclusionClauses, policyName]);

  const cp4Status: CP4Status = useMemo(() => {
    // Priority 1: Use saved analyst decision
    if (claim.cp4Decision?.analystDecision) {
      if (claim.cp4Decision.analystDecision === 'LANJUT') {
        const hasExclusions = aiRecommendation.diagnosesAnalysis?.some(d => d.isExcluded);
        return hasExclusions ? 'ADA_PENGECUALIAN' : 'BUKAN_PENGECUALIAN';
      }
      return 'PENGECUALIAN';
    }
    
    // Priority 2: Use local decision (user made a selection but hasn't saved yet)
    if (selectedDecision) {
      if (selectedDecision === 'lanjut') {
        const hasExclusions = aiRecommendation.diagnosesAnalysis?.some(d => d.isExcluded);
        return hasExclusions ? 'ADA_PENGECUALIAN' : 'BUKAN_PENGECUALIAN';
      }
      return 'PENGECUALIAN';
    }
    
    // Priority 3: Use AI recommendation status (header should match content)
    // This ensures header badge reflects the same detection as diagnosis badges
    switch (aiRecommendation.status) {
      case 'NOT_EXCLUDED':
        return 'BUKAN_PENGECUALIAN';
      case 'EXCLUDED':
        return 'PENGECUALIAN';
      case 'PARTIAL_EXCLUSION':
        return 'ADA_PENGECUALIAN';
      default:
        return 'PENDING';
    }
  }, [claim.cp4Decision, selectedDecision, aiRecommendation]);

  const getStatusBadge = () => {
    switch (cp4Status) {
      case 'BUKAN_PENGECUALIAN':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 font-medium">
            Bukan Pengecualian
          </Badge>
        );
      case 'PENGECUALIAN':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0 font-medium">
            Pengecualian
          </Badge>
        );
      case 'ADA_PENGECUALIAN':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0 font-medium">
            Ada Pengecualian
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 font-medium">
            Pending
          </Badge>
        );
    }
  };

  const isOverridingAI = useMemo(() => {
    if (!selectedDecision) return false;
    
    const aiRecommends = aiRecommendation.recommendedAction;
    if (aiRecommends === 'CONTINUE' && selectedDecision === 'tolak') return true;
    if (aiRecommends === 'REJECT' && selectedDecision === 'lanjut') return true;
    
    return false;
  }, [selectedDecision, aiRecommendation]);

  useEffect(() => {
    if (claim.cp4Decision?.analystDecision) {
      setSelectedDecision(claim.cp4Decision.analystDecision === 'LANJUT' ? 'lanjut' : 'tolak');
      setJustification(claim.cp4Decision.justification || '');
    }
  }, [claim.cp4Decision]);

  useEffect(() => {
    onDecisionChange(
      selectedDecision === 'lanjut' ? 'LANJUT' : selectedDecision === 'tolak' ? 'TOLAK' : null,
      isOverridingAI,
      justification
    );
  }, [selectedDecision, isOverridingAI, justification, onDecisionChange]);

  const handleSave = () => {
    if (isOverridingAI && justification.length < 20) {
      setValidationError('Justifikasi wajib diisi minimal 20 karakter untuk override keputusan AI');
      return;
    }
    
    setValidationError(null);
    
    if (selectedDecision === 'lanjut') {
      onSave('continue');
    } else if (selectedDecision === 'tolak') {
      onSave('reject');
    }
  };

  const getDecisionOptions = () => {
    const aiRecommends = aiRecommendation.recommendedAction;
    const hasPartialExclusion = aiRecommendation.status === 'PARTIAL_EXCLUSION';
    
    if (aiRecommends === 'CONTINUE') {
      if (hasPartialExclusion) {
        const excludedDiagnoses = aiRecommendation.diagnosesAnalysis?.filter(d => d.isExcluded) || [];
        const nonExcludedDiagnoses = aiRecommendation.diagnosesAnalysis?.filter(d => !d.isExcluded) || [];
        
        return (
          <RadioGroup
            value={selectedDecision || ''}
            onValueChange={(value) => {
              setSelectedDecision(value as 'lanjut' | 'tolak');
              setValidationError(null);
            }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="lanjut" id="cp4-lanjut" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="cp4-lanjut" className="text-sm font-medium cursor-pointer">
                  Lanjutkan - Review porsi yang tidak dikecualikan
                </Label>
                <p className="text-xs text-slate-600 mt-1">
                  {excludedDiagnoses.map(d => d.diagnosisName).join(', ')} direject, {nonExcludedDiagnoses.map(d => d.diagnosisName).join(', ')} dilanjutkan
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="tolak" id="cp4-tolak" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="cp4-tolak" className="text-sm font-medium cursor-pointer">
                  Tolak seluruh klaim - Override
                </Label>
                {selectedDecision === 'tolak' && (
                  <div className="mt-2">
                    <Label className="text-xs text-slate-600">Justifikasi (wajib diisi):</Label>
                    <Textarea
                      placeholder="Berikan alasan untuk menolak seluruh klaim..."
                      className="mt-1 text-sm"
                      rows={2}
                      value={justification}
                      onChange={(e) => {
                        setJustification(e.target.value);
                        if (e.target.value.length >= 20) setValidationError(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        );
      }
      
      return (
        <RadioGroup
          value={selectedDecision || ''}
          onValueChange={(value) => {
            setSelectedDecision(value as 'lanjut' | 'tolak');
            setValidationError(null);
          }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
            <RadioGroupItem value="lanjut" id="cp4-lanjut" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="cp4-lanjut" className="text-sm font-medium cursor-pointer text-green-800">
                Lanjutkan - Bukan pengecualian
              </Label>
              <p className="text-xs text-green-700 mt-1">Sesuai rekomendasi AI</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="tolak" id="cp4-tolak" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="cp4-tolak" className="text-sm font-medium cursor-pointer">
                Tolak klaim - Adalah pengecualian
              </Label>
              {selectedDecision === 'tolak' && (
                <div className="mt-2">
                  <Label className="text-xs text-slate-600">Justifikasi (wajib diisi):</Label>
                  <Textarea
                    placeholder="Berikan alasan mengapa diagnosa ini dikecualikan..."
                    className="mt-1 text-sm"
                    rows={2}
                    value={justification}
                    onChange={(e) => {
                      setJustification(e.target.value);
                      if (e.target.value.length >= 20) setValidationError(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      );
    } else {
      return (
        <RadioGroup
          value={selectedDecision || ''}
          onValueChange={(value) => {
            setSelectedDecision(value as 'lanjut' | 'tolak');
            setValidationError(null);
          }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="lanjut" id="cp4-lanjut" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="cp4-lanjut" className="text-sm font-medium cursor-pointer">
                Lanjutkan - Override (bukan pengecualian)
              </Label>
              {selectedDecision === 'lanjut' && (
                <div className="mt-2">
                  <Label className="text-xs text-slate-600">Justifikasi (wajib diisi):</Label>
                  <Textarea
                    placeholder="Berikan alasan mengapa diagnosa ini bukan pengecualian..."
                    className="mt-1 text-sm"
                    rows={2}
                    value={justification}
                    onChange={(e) => {
                      setJustification(e.target.value);
                      if (e.target.value.length >= 20) setValidationError(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
            <RadioGroupItem value="tolak" id="cp4-tolak" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="cp4-tolak" className="text-sm font-medium cursor-pointer text-red-800">
                Tolak klaim - Sesuai rekomendasi AI
              </Label>
              <p className="text-xs text-red-700 mt-1">Diagnosa termasuk dalam pengecualian polis</p>
            </div>
          </div>
        </RadioGroup>
      );
    }
  };

  const getActionButton = () => {
    const willContinue = selectedDecision === 'lanjut';
    const willReject = selectedDecision === 'tolak';
    
    if (!selectedDecision) {
      return (
        <Button disabled className="w-full" data-testid="cp4-save-button">
          Pilih keputusan terlebih dahulu
        </Button>
      );
    }
    
    if (willContinue) {
      return (
        <Button 
          onClick={handleSave}
          className="w-full bg-green-600 hover:bg-green-700"
          data-testid="cp4-save-button"
        >
          Simpan & Lanjut ke Checkpoint Berikutnya
        </Button>
      );
    }
    
    if (willReject) {
      return (
        <Button 
          onClick={handleSave}
          className="w-full bg-red-600 hover:bg-red-700"
          data-testid="cp4-save-button"
        >
          Simpan & Tolak Klaim
        </Button>
      );
    }
    
    return null;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onExpandChange}>
      <Card 
        ref={checkpointRef} 
        className={`overflow-hidden transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} 
        data-testid="checkpoint-4"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-900 text-left">Pengecualian Polis & Masa Tunggu</h2>
              {getStatusBadge()}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
            
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2">📋 Diagnosis</h3>
              <div className="space-y-1.5">
                {(aiRecommendation.diagnosesAnalysis || []).length > 0 ? (
                  aiRecommendation.diagnosesAnalysis?.map((diagnosis, index) => (
                    <div 
                      key={index}
                      className={`p-2.5 rounded-lg border ${
                        diagnosis.isExcluded 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              diagnosis.isExcluded ? 'text-red-800' : 'text-green-800'
                            }`}>
                              {diagnosis.diagnosisName}
                            </span>
                            {diagnosis.isPrimary && (
                              <Badge variant="outline" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            ICD-10: <span className="font-mono">{diagnosis.icd10Code}</span>
                          </p>
                          {diagnosis.isExcluded && diagnosis.exclusionClausePasal && (
                            <p className="text-xs text-red-700 mt-1">
                              {diagnosis.exclusionClausePasal}: {diagnosis.exclusionClauseTitle}
                            </p>
                          )}
                          {diagnosis.isComplication && diagnosis.relatedToDiagnosis && (
                            <p className="text-xs text-orange-700 mt-1">
                              ⚠️ Komplikasi dari: {diagnosis.relatedToDiagnosis}
                            </p>
                          )}
                        </div>
                        <div>
                          {diagnosis.isExcluded ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Dikecualikan
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Tidak Dikecualikan
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                    <p className="text-sm text-slate-600">Diagnosis: {claim.diagnosis || 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-1">ICD-10: N/A</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">📖 Referensi Polis</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{aiRecommendation.policyReference?.document || 'Master Policy'}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {aiRecommendation.policyReference?.clause || 'Pasal IV: Daftar Pengecualian'}
                    </p>
                  </div>
                  {claim.policyPdfUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        window.open(claim.policyPdfUrl, '_blank');
                      }}
                      data-testid="cp4-open-policy-pdf"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lihat PDF
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="flex items-center gap-1.5 text-xs text-slate-400 border-slate-200 cursor-not-allowed"
                      title="PDF polis belum tersedia"
                      data-testid="cp4-open-policy-pdf-disabled"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lihat PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">💡 Keputusan Anda</h3>
              {getDecisionOptions()}
              
              {validationError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {validationError}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              {getActionButton()}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
