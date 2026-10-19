import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPostStatus } from './types.js';
export interface BlogPostFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BlogPostStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BlogPostStatus | '') => void;
}
export declare function BlogPostFilters({ onStatusChange, ...props }: BlogPostFiltersProps): import("react").JSX.Element;
