import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenu } from './types.js';
export interface RestaurantMenuTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    emptyMessage?: string;
}
export declare function RestaurantMenuTable(props: RestaurantMenuTableProps): import("react").JSX.Element;
