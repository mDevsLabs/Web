import { type DomainFrameProps } from '../../internal/domain.js';
import type { Review } from './types.js';
export interface ReviewFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Review>;
    onSubmit: (value: Omit<Review, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ReviewForm({ onSubmit, ...props }: ReviewFormProps): import("react").JSX.Element;
