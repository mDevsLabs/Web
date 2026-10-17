import { type DomainFrameProps } from '../../internal/domain.js';
import type { Nutrition, NutritionMetric } from './types.js';
export interface NutritionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Nutrition[];
    metrics: readonly NutritionMetric[];
}
export declare function NutritionOverview(props: NutritionOverviewProps): import("react").JSX.Element;
