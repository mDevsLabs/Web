import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrder } from './types.js';
export interface PurchaseOrderTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PurchaseOrder[];
    emptyMessage?: string;
}
export declare function PurchaseOrderTable(props: PurchaseOrderTableProps): import("react").JSX.Element;
