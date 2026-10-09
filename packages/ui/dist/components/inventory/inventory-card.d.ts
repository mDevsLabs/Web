import { type DomainFrameProps } from '../../internal/domain.js';
import type { Inventory } from './types.js';
export interface InventoryCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Inventory;
}
export declare function InventoryCard(props: InventoryCardProps): import("react").JSX.Element;
