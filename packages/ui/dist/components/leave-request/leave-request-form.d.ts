import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequest } from './types.js';
export interface LeaveRequestFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<LeaveRequest>;
    onSubmit: (value: Omit<LeaveRequest, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function LeaveRequestForm({ onSubmit, ...props }: LeaveRequestFormProps): import("react").JSX.Element;
