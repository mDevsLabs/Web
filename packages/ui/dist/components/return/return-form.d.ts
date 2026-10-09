import { type DomainFrameProps } from '../../internal/domain.js';
import type { Return } from './types.js';
export interface ReturnFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Return>;
    onSubmit: (value: Omit<Return, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ReturnForm({ onSubmit, ...props }: ReturnFormProps): import("react").JSX.Element;
