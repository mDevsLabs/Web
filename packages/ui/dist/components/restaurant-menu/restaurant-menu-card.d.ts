import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenu } from './types.js';
export interface RestaurantMenuCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: RestaurantMenu;
}
export declare function RestaurantMenuCard(props: RestaurantMenuCardProps): import("react").JSX.Element;
