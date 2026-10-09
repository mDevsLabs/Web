import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticleStatus } from './types.js';
export interface KnowledgeArticleFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: KnowledgeArticleStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: KnowledgeArticleStatus | '') => void;
}
export declare function KnowledgeArticleFilters({ onStatusChange, ...props }: KnowledgeArticleFiltersProps): import("react").JSX.Element;
