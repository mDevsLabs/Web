import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenuMetric } from './types.js';
export interface RestaurantMenuStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RestaurantMenuMetric[];
}
export declare function RestaurantMenuStats(props: RestaurantMenuStatsProps): import("react").JSX.Element;
