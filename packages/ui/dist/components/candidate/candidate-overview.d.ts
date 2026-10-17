import { type DomainFrameProps } from '../../internal/domain.js';
import type { Candidate, CandidateMetric } from './types.js';
export interface CandidateOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Candidate[];
    metrics: readonly CandidateMetric[];
}
export declare function CandidateOverview(props: CandidateOverviewProps): import("react").JSX.Element;
