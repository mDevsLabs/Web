import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payroll } from './types.js';
export interface PayrollCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Payroll;
}
export declare function PayrollCard(props: PayrollCardProps): import("react").JSX.Element;
