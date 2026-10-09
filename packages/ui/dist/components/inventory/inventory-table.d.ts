import { type DomainFrameProps } from '../../internal/domain.js';
import type { Inventory } from './types.js';
export interface InventoryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Inventory[];
    emptyMessage?: string;
}
export declare function InventoryTable(props: InventoryTableProps): import("react").JSX.Element;
