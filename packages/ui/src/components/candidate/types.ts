import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Candidate = {
    id?: string;
    name: string;
    email: string;
    position: string;
    score: number;
    status: "applied" | "screening" | "interview" | "offer" | "rejected";
};
export type CandidateStatus = Candidate['status'];
export interface CandidateActivity extends DomainActivity {
    candidateId?: string;
}
export type CandidateMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCandidate' | 'activeCandidate' | 'valueCandidate';
};
export type CandidateSettingsValues = Partial<Record<"notifyCandidate" | "archiveCandidate" | "approveCandidate", boolean>>;
