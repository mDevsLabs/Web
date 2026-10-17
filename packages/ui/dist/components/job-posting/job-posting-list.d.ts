import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPosting } from './types.js';
export interface JobPostingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly JobPosting[];
    onSelect?: (item: JobPosting) => void;
    emptyMessage?: string;
}
export declare function JobPostingList({ onSelect, ...props }: JobPostingListProps): import("react").JSX.Element;
