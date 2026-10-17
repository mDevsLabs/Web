import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPost } from './types.js';
export interface BlogPostFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BlogPost>;
    onSubmit: (value: Omit<BlogPost, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BlogPostForm({ onSubmit, ...props }: BlogPostFormProps): import("react").JSX.Element;
