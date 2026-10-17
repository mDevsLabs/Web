import { type DomainFrameProps } from '../../internal/domain.js';
import type { Comment } from './types.js';
export interface CommentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Comment;
}
export declare function CommentCard(props: CommentCardProps): import("react").JSX.Element;
