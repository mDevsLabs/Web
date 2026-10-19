import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shift } from './types.js';
export interface ShiftFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Shift>;
    onSubmit: (value: Omit<Shift, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ShiftForm({ onSubmit, ...props }: ShiftFormProps): import("react").JSX.Element;
