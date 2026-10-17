import { type DomainFrameProps } from '../../internal/domain.js';
import type { Warehouse } from './types.js';
export interface WarehouseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Warehouse;
}
export declare function WarehouseCard(props: WarehouseCardProps): import("react").JSX.Element;
