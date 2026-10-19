import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payroll } from './types.js';
export interface PayrollListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payroll[];
    onSelect?: (item: Payroll) => void;
    emptyMessage?: string;
}
export declare function PayrollList({ onSelect, ...props }: PayrollListProps): import("react").JSX.Element;
