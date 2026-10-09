import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReviewStatus } from './types.js';
export interface ReviewFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReviewStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReviewStatus | '') => void;
}
export declare function ReviewFilters({ onStatusChange, ...props }: ReviewFiltersProps): import("react").JSX.Element;
