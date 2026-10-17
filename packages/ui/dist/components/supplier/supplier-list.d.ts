import { type DomainFrameProps } from '../../internal/domain.js';
import type { Supplier } from './types.js';
export interface SupplierListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Supplier[];
    onSelect?: (item: Supplier) => void;
    emptyMessage?: string;
}
export declare function SupplierList({ onSelect, ...props }: SupplierListProps): import("react").JSX.Element;
