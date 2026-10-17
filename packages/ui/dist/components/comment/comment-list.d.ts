import { type DomainFrameProps } from '../../internal/domain.js';
import type { Comment } from './types.js';
export interface CommentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Comment[];
    onSelect?: (item: Comment) => void;
    emptyMessage?: string;
}
export declare function CommentList({ onSelect, ...props }: CommentListProps): import("react").JSX.Element;
