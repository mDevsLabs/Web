import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrder } from './types.js';
export interface PurchaseOrderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PurchaseOrder[];
    onSelect?: (item: PurchaseOrder) => void;
    emptyMessage?: string;
}
export declare function PurchaseOrderList({ onSelect, ...props }: PurchaseOrderListProps): import("react").JSX.Element;
