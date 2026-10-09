import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPost } from './types.js';
export interface BlogPostListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BlogPost[];
    onSelect?: (item: BlogPost) => void;
    emptyMessage?: string;
}
export declare function BlogPostList({ onSelect, ...props }: BlogPostListProps): import("react").JSX.Element;
