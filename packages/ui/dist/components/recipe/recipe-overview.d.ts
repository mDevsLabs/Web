import { type DomainFrameProps } from '../../internal/domain.js';
import type { Recipe, RecipeMetric } from './types.js';
export interface RecipeOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Recipe[];
    metrics: readonly RecipeMetric[];
}
export declare function RecipeOverview(props: RecipeOverviewProps): import("react").JSX.Element;
