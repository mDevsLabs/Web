import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPostingStatus } from './types.js';
export interface JobPostingFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: JobPostingStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: JobPostingStatus | '') => void;
}
export declare function JobPostingFilters({ onStatusChange, ...props }: JobPostingFiltersProps): import("react").JSX.Element;
