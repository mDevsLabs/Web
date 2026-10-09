import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenu, RestaurantMenuMetric } from './types.js';
export interface RestaurantMenuOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    metrics: readonly RestaurantMenuMetric[];
}
export declare function RestaurantMenuOverview(props: RestaurantMenuOverviewProps): import("react").JSX.Element;
