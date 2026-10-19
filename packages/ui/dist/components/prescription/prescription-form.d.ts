import { type DomainFrameProps } from '../../internal/domain.js';
import type { Prescription } from './types.js';
export interface PrescriptionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Prescription>;
    onSubmit: (value: Omit<Prescription, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PrescriptionForm({ onSubmit, ...props }: PrescriptionFormProps): import("react").JSX.Element;
