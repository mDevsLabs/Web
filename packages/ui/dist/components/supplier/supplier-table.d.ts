import { type DomainFrameProps } from '../../internal/domain.js';
import type { Supplier } from './types.js';
export interface SupplierTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Supplier[];
    emptyMessage?: string;
}
export declare function SupplierTable(props: SupplierTableProps): import("react").JSX.Element;
