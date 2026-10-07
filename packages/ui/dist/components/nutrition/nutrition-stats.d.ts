import { type DomainFrameProps } from '../../internal/domain.js';
import type { NutritionMetric } from './types.js';
export interface NutritionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly NutritionMetric[];
}
export declare function NutritionStats(props: NutritionStatsProps): import("react").JSX.Element;
