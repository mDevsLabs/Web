import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrder } from './types.js';
export interface PurchaseOrderCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: PurchaseOrder;
}
export declare function PurchaseOrderCard(props: PurchaseOrderCardProps): import("react").JSX.Element;
