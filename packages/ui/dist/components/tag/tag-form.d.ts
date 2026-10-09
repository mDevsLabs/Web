import { type DomainFrameProps } from '../../internal/domain.js';
import type { Tag } from './types.js';
export interface TagFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Tag>;
    onSubmit: (value: Omit<Tag, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TagForm({ onSubmit, ...props }: TagFormProps): import("react").JSX.Element;
