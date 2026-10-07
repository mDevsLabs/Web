import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenu } from './types.js';
export interface RestaurantMenuListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    onSelect?: (item: RestaurantMenu) => void;
    emptyMessage?: string;
}
export declare function RestaurantMenuList({ onSelect, ...props }: RestaurantMenuListProps): import("react").JSX.Element;
