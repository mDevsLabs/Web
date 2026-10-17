import { type DomainFrameProps } from '../../internal/domain.js';
import type { CandidateMetric } from './types.js';
export interface CandidateStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CandidateMetric[];
}
export declare function CandidateStats(props: CandidateStatsProps): import("react").JSX.Element;
