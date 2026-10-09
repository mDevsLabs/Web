import { type DomainFrameProps } from '../../internal/domain.js';
import type { Document } from './types.js';
export interface DocumentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Document>;
    onSubmit: (value: Omit<Document, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function DocumentForm({ onSubmit, ...props }: DocumentFormProps): import("react").JSX.Element;
