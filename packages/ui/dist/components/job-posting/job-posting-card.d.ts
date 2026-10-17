import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPosting } from './types.js';
export interface JobPostingCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: JobPosting;
}
export declare function JobPostingCard(props: JobPostingCardProps): import("react").JSX.Element;
