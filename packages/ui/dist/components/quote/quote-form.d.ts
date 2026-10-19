import { type DomainFrameProps } from '../../internal/domain.js';
import type { Quote } from './types.js';
export interface QuoteFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Quote>;
    onSubmit: (value: Omit<Quote, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function QuoteForm({ onSubmit, ...props }: QuoteFormProps): import("react").JSX.Element;
