import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequestStatus } from './types.js';
export interface PullRequestFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PullRequestStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PullRequestStatus | '') => void;
}
export declare function PullRequestFilters({ onStatusChange, ...props }: PullRequestFiltersProps): import("react").JSX.Element;
