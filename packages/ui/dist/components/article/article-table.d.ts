import { type DomainFrameProps } from '../../internal/domain.js';
import type { Article } from './types.js';
export interface ArticleTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    emptyMessage?: string;
}
export declare function ArticleTable(props: ArticleTableProps): import("react").JSX.Element;
