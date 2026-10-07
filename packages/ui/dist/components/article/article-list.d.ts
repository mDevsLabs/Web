import { type DomainFrameProps } from '../../internal/domain.js';
import type { Article } from './types.js';
export interface ArticleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    onSelect?: (item: Article) => void;
    emptyMessage?: string;
}
export declare function ArticleList({ onSelect, ...props }: ArticleListProps): import("react").JSX.Element;
