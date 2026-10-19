import { type DomainFrameProps } from '../../internal/domain.js';
import type { Customer } from './types.js';
export interface CustomerCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Customer;
}
export declare function CustomerCard(props: CustomerCardProps): import("react").JSX.Element;
