import { type DomainFrameProps } from '../../internal/domain.js';
import type { Customer } from './types.js';
export interface CustomerListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Customer[];
    onSelect?: (item: Customer) => void;
    emptyMessage?: string;
}
export declare function CustomerList({ onSelect, ...props }: CustomerListProps): import("react").JSX.Element;
