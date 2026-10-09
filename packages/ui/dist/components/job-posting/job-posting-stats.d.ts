import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPostingMetric } from './types.js';
export interface JobPostingStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly JobPostingMetric[];
}
export declare function JobPostingStats(props: JobPostingStatsProps): import("react").JSX.Element;
