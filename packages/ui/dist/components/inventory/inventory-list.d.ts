import { type DomainFrameProps } from '../../internal/domain.js';
import type { Inventory } from './types.js';
export interface InventoryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Inventory[];
    onSelect?: (item: Inventory) => void;
    emptyMessage?: string;
}
export declare function InventoryList({ onSelect, ...props }: InventoryListProps): import("react").JSX.Element;
