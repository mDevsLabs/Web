import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPost } from './types.js';
export interface BlogPostTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BlogPost[];
    emptyMessage?: string;
}
export declare function BlogPostTable(props: BlogPostTableProps): import("react").JSX.Element;
