import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPost } from './types.js';
export interface BlogPostCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: BlogPost;
}
export declare function BlogPostCard(props: BlogPostCardProps): import("react").JSX.Element;
