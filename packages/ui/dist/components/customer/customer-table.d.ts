import { type DomainFrameProps } from '../../internal/domain.js';
import type { Customer } from './types.js';
export interface CustomerTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Customer[];
    emptyMessage?: string;
}
export declare function CustomerTable(props: CustomerTableProps): import("react").JSX.Element;
