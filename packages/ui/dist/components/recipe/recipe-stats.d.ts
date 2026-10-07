import { type DomainFrameProps } from '../../internal/domain.js';
import type { RecipeMetric } from './types.js';
export interface RecipeStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RecipeMetric[];
}
export declare function RecipeStats(props: RecipeStatsProps): import("react").JSX.Element;
