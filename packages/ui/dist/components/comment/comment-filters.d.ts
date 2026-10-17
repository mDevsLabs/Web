import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommentStatus } from './types.js';
export interface CommentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CommentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CommentStatus | '') => void;
}
export declare function CommentFilters({ onStatusChange, ...props }: CommentFiltersProps): import("react").JSX.Element;
