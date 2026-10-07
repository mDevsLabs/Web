import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPosting } from './types.js';
export interface JobPostingTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly JobPosting[];
    emptyMessage?: string;
}
export declare function JobPostingTable(props: JobPostingTableProps): import("react").JSX.Element;
