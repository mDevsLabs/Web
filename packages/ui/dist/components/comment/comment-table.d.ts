import { type DomainFrameProps } from '../../internal/domain.js';
import type { Comment } from './types.js';
export interface CommentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Comment[];
    emptyMessage?: string;
}
export declare function CommentTable(props: CommentTableProps): import("react").JSX.Element;
