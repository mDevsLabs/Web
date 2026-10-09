import { type DomainFrameProps } from '../../internal/domain.js';
import type { Article } from './types.js';
export interface ArticleCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Article;
}
export declare function ArticleCard(props: ArticleCardProps): import("react").JSX.Element;
