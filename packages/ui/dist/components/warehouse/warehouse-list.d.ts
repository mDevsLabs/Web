import { type DomainFrameProps } from '../../internal/domain.js';
import type { Warehouse } from './types.js';
export interface WarehouseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Warehouse[];
    onSelect?: (item: Warehouse) => void;
    emptyMessage?: string;
}
export declare function WarehouseList({ onSelect, ...props }: WarehouseListProps): import("react").JSX.Element;
