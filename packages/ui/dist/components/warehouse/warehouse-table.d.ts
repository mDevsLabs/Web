import { type DomainFrameProps } from '../../internal/domain.js';
import type { Warehouse } from './types.js';
export interface WarehouseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Warehouse[];
    emptyMessage?: string;
}
export declare function WarehouseTable(props: WarehouseTableProps): import("react").JSX.Element;
