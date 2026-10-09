import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payroll } from './types.js';
export interface PayrollFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Payroll>;
    onSubmit: (value: Omit<Payroll, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PayrollForm({ onSubmit, ...props }: PayrollFormProps): import("react").JSX.Element;
