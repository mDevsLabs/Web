import { type DomainFrameProps } from '../../internal/domain.js';
import type { Comment } from './types.js';
export interface CommentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Comment>;
    onSubmit: (value: Omit<Comment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CommentForm({ onSubmit, ...props }: CommentFormProps): import("react").JSX.Element;
