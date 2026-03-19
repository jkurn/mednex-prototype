// Global Member API for Claims Module integration (Checkpoint 1)
// This provides member validation functionality accessible via window.stratorMemberAPI

export interface MemberValidationResult {
  passed: boolean;
  checkpoint: string;
  tag?: string;
  category?: string;
  message: string;
  recommendation?: string;
  member_data?: {
    id: number;
    memberId: string;
    policyId: string;
    policyNumber: string | null;
    policyholderName: string;
    policyExpiryDate: string | null;
    memberCardNumber: string;
    fullName: string;
    principalMemberId: string | null;
    principalName: string | null;
    relationship: string;
    gender: string;
    dateOfBirth: string;
    enrollmentDate: string;
    terminationDate: string | null;
    status: string;
  };
}

export interface MemberLookupResult {
  found: boolean;
  member?: {
    id: number;
    memberId: string;
    memberCardNumber: string;
    fullName: string;
    policyholderName: string;
    relationship: string;
    status: string;
    enrollmentDate: string;
    terminationDate: string | null;
  };
}

export interface StratorMemberAPI {
  validateMember: (memberCardNumber: string, claimantName?: string) => Promise<MemberValidationResult>;
  lookupMember: (memberCardNumber: string) => Promise<MemberLookupResult>;
  getActiveMembersCount: () => Promise<number>;
  searchMembers: (query: string) => Promise<MemberLookupResult[]>;
}

const memberAPI: StratorMemberAPI = {
  // Validate member eligibility for Claims Module Checkpoint 1
  // All validation outcomes return 200 OK - check 'passed' and 'status' fields
  // status: VALIDATION_PASSED | VALIDATION_FAILED | VALIDATION_ERROR
  async validateMember(memberCardNumber: string, claimantName?: string): Promise<MemberValidationResult> {
    try {
      const response = await fetch('/api/members/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberCardNumber, claimantName }),
      });
      
      const result = await response.json();
      
      // All responses return structured validation result with 'passed' field
      return result;
    } catch (error) {
      console.error('Member validation error:', error);
      return {
        passed: false,
        checkpoint: 'CP1',
        tag: 'CP1_SYSTEM_ERROR',
        category: 'PELANGGARAN_POLIS',
        message: 'Gagal memvalidasi data peserta',
        recommendation: 'REVIEW: Sistem tidak dapat memverifikasi data',
      };
    }
  },

  async lookupMember(memberCardNumber: string): Promise<MemberLookupResult> {
    try {
      const response = await fetch(`/api/members/card/${encodeURIComponent(memberCardNumber)}`);
      
      if (response.status === 404) {
        return { found: false };
      }
      
      if (!response.ok) {
        throw new Error('Failed to lookup member');
      }
      
      const member = await response.json();
      return {
        found: true,
        member: {
          id: member.id,
          memberId: member.memberId,
          memberCardNumber: member.memberCardNumber,
          fullName: member.fullName,
          policyholderName: member.policyholderName,
          relationship: member.relationship,
          status: member.status,
          enrollmentDate: member.enrollmentDate,
          terminationDate: member.terminationDate,
        },
      };
    } catch (error) {
      console.error('Member lookup error:', error);
      return { found: false };
    }
  },

  async getActiveMembersCount(): Promise<number> {
    try {
      const response = await fetch('/api/members/stats/count');
      if (!response.ok) {
        throw new Error('Failed to fetch member count');
      }
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching member count:', error);
      return 0;
    }
  },

  async searchMembers(query: string): Promise<MemberLookupResult[]> {
    try {
      const response = await fetch(`/api/members?search=${encodeURIComponent(query)}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to search members');
      }
      const data = await response.json();
      return data.members.map((member: any) => ({
        found: true,
        member: {
          id: member.id,
          memberId: member.memberId,
          memberCardNumber: member.memberCardNumber,
          fullName: member.fullName,
          policyholderName: member.policyholderName,
          relationship: member.relationship,
          status: member.status,
          enrollmentDate: member.enrollmentDate,
          terminationDate: member.terminationDate,
        },
      }));
    } catch (error) {
      console.error('Member search error:', error);
      return [];
    }
  },
};

// Register on window for global access
declare global {
  interface Window {
    stratorMemberAPI: StratorMemberAPI;
  }
}

export function initializeMemberAPI(): void {
  window.stratorMemberAPI = memberAPI;
  console.log('✅ Strator Member API initialized (window.stratorMemberAPI)');
}

export default memberAPI;
