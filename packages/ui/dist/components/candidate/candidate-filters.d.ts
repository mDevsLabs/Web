import { type DomainFrameProps } from '../../internal/domain.js';
import type { CandidateStatus } from './types.js';
export interface CandidateFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CandidateStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CandidateStatus | '') => void;
}
export declare function CandidateFilters({ onStatusChange, ...props }: CandidateFiltersProps): import("react").JSX.Element;
