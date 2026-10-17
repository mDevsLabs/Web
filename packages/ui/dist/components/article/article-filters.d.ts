import { type DomainFrameProps } from '../../internal/domain.js';
import type { ArticleStatus } from './types.js';
export interface ArticleFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ArticleStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ArticleStatus | '') => void;
}
export declare function ArticleFilters({ onStatusChange, ...props }: ArticleFiltersProps): import("react").JSX.Element;
