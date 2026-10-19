import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPosting, JobPostingMetric } from './types.js';
export interface JobPostingOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly JobPosting[];
    metrics: readonly JobPostingMetric[];
}
export declare function JobPostingOverview(props: JobPostingOverviewProps): import("react").JSX.Element;
